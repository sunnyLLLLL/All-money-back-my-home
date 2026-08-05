const ALLOWED_ORIGIN = "https://sunnylllll.github.io";
const SESSION_HOURS = 12;

function headers(request) {
  const origin = request.headers.get("Origin");
  return {
    "Content-Type": "application/json; charset=UTF-8",
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin"
  };
}
const respond=(request,data,status=200)=>new Response(JSON.stringify(data),{status,headers:headers(request)});
async function sha256(value){const data=new TextEncoder().encode(value);const hash=await crypto.subtle.digest("SHA-256",data);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function equal(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function token(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function session(request,env){const auth=request.headers.get("Authorization")||"";if(!auth.startsWith("Bearer "))return null;const raw=auth.slice(7).trim();if(!raw)return null;const hash=await sha256(raw);const found=await env.DB.prepare("SELECT id, expires_at FROM sessions WHERE token_hash = ?").bind(hash).first();if(!found)return null;if(new Date(found.expires_at).getTime()<=Date.now()){await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(found.id).run();return null;}return {id:found.id};}
async function prepareState(env){await env.DB.prepare("CREATE TABLE IF NOT EXISTS app_state (state_key TEXT PRIMARY KEY, state_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();}

export default {
  async fetch(request,env){
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:headers(request)});
    const url=new URL(request.url);
    if(url.pathname==="/api/health"&&request.method==="GET"){
      const result=await env.DB.prepare("SELECT COUNT(*) AS table_count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").first();
      return respond(request,{success:true,message:"D1資料庫連線成功",tableCount:result.table_count});
    }
    if(url.pathname==="/api/login"&&request.method==="POST"){
      try{
        const body=await request.json();const password=String(body.password||"");
        if(!password)return respond(request,{success:false,message:"請輸入密碼"},400);
        if(!equal(await sha256(password),await sha256(env.APP_PASSWORD)))return respond(request,{success:false,message:"密碼錯誤"},401);
        const raw=token();const expiresAt=new Date(Date.now()+SESSION_HOURS*3600000).toISOString();
        await env.DB.prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)").bind(await sha256(raw),expiresAt).run();
        return respond(request,{success:true,message:"登入成功",token:raw,expiresAt});
      }catch{return respond(request,{success:false,message:"登入處理失敗"},500);}
    }
    if(url.pathname==="/api/session"&&request.method==="GET"){
      return await session(request,env)?respond(request,{success:true,authenticated:true}):respond(request,{success:false,authenticated:false,message:"尚未登入或登入已過期"},401);
    }
    if(url.pathname==="/api/logout"&&request.method==="POST"){
      const active=await session(request,env);if(active)await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(active.id).run();
      return respond(request,{success:true,message:"已登出"});
    }
    if(url.pathname==="/api/state"){
      const active=await session(request,env);if(!active)return respond(request,{success:false,message:"請先登入"},401);
      await prepareState(env);
      if(request.method==="GET"){
        const row=await env.DB.prepare("SELECT state_json, updated_at FROM app_state WHERE state_key = 'main'").first();
        return respond(request,{success:true,state:row?JSON.parse(row.state_json):null,updatedAt:row?.updated_at||null});
      }
      if(request.method==="PUT"){
        try{
          const state=await request.json();const value=JSON.stringify(state);
          if(value.length>8000000)return respond(request,{success:false,message:"資料量過大"},413);
          await env.DB.prepare("INSERT INTO app_state (state_key,state_json,updated_at) VALUES ('main',?,CURRENT_TIMESTAMP) ON CONFLICT(state_key) DO UPDATE SET state_json=excluded.state_json,updated_at=CURRENT_TIMESTAMP").bind(value).run();
          return respond(request,{success:true,message:"已同步"});
        }catch{return respond(request,{success:false,message:"同步失敗"},500);}
      }
    }
    return respond(request,{success:false,message:"找不到這個 API"},404);
  }
};
