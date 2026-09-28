import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(()=>({ auth:vi.fn(),own:vi.fn(),rpc:vi.fn(),search:vi.fn(),media:vi.fn(),read:vi.fn() }));
vi.mock('@/lib/auth-credits',()=>({requireAuth:m.auth}));
vi.mock('@/lib/session-ownership',()=>({verifyTeacherOwnsSession:m.own}));
vi.mock('@/lib/supabase/service',()=>({createServiceClient:()=>({rpc:m.rpc})}));
vi.mock('@/lib/sources/serper',async original=>({ ...await original<object>(),searchSerper:m.search }));
vi.mock('@/lib/sources/serper-media',()=>({searchSerperMedia:m.media}));
vi.mock('@/lib/sources/reader',()=>({readSource:m.read}));
import { POST as search } from '@/app/api/sessions/[sessionId]/sources/search/route';
import { POST as read } from '@/app/api/sessions/[sessionId]/sources/read/route';
const sessionId='00000000-0000-4000-8000-000000000001',teacherId='00000000-0000-4000-8000-000000000002';
const params={sessionId};
function req(payload:unknown,origin='https://app.example.com') {return new Request('https://app.example.com/api/sessions/'+sessionId+'/sources/search',{
 method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(payload)});}
const query={surface:'web',query:'Japan',page:0};
beforeEach(()=>{
 vi.resetAllMocks();vi.stubEnv('SOURCES_ENABLED','true');vi.stubEnv('NEXT_PUBLIC_MOCK_MODE','false');
 vi.stubEnv('SERPER_API_KEY','synthetic');vi.stubEnv('LIVE_ROOM_SEARCH_DAILY_CAP','100');
 m.auth.mockResolvedValue({teacher:{id:teacherId},error:null});m.own.mockResolvedValue({session:{id:sessionId},error:null});
 m.rpc.mockResolvedValue({data:1,error:null});m.search.mockResolvedValue({tab:'web',query:'Japan',page:0,results:[],nextPage:null,retrievedAt:'2026-09-28T00:00:00Z'});
 m.media.mockResolvedValue({items:[]});m.read.mockResolvedValue({text:'Article',publisher:'Synthetic'});
});
afterEach(()=>vi.unstubAllEnvs());
it('checks ownership and reserves before one provider call',async()=>{
 const result=await search(req(query),{params});expect(result.status).toBe(200);
 expect(result.headers.get('cache-control')).toBe('private, no-store');
 expect(m.own).toHaveBeenCalledWith(sessionId,teacherId);
 expect(m.rpc).toHaveBeenCalledWith('reserve_teacher_source_search',{p_teacher_id:teacherId,p_cap:100});
 expect(m.rpc.mock.invocationCallOrder[0]).toBeLessThan(m.search.mock.invocationCallOrder[0]);
});
it('at limit blocks search but direct reading still works',async()=>{
 m.rpc.mockResolvedValue({error:{message:'SOURCE_LIMIT'}});
 expect((await search(req(query),{params})).status).toBe(429);expect(m.search).not.toHaveBeenCalled();
 expect((await read(req({url:'https://example.com/article#part'}),{params})).status).toBe(200);
 expect(m.read).toHaveBeenCalledWith('https://example.com/article');expect(m.rpc).toHaveBeenCalledTimes(1);
});
it('storage failure blocks paid calls without breaking direct reads',async()=>{
 m.rpc.mockResolvedValue({error:{message:'database private detail'}});
 const result=await search(req(query),{params});expect(result.status).toBe(503);
 expect(await result.json()).toEqual({error:'SOURCE_BUDGET_UNAVAILABLE'});
 expect((await read(req({url:'https://example.com'}),{params})).status).toBe(200);expect(m.search).not.toHaveBeenCalled();
});
it('new UTC day has a fresh allowance in the mocked reserve store, across sessions',async()=>{
 let now='2026-09-28T23:59:59Z';const counts=new Map<string,number>();vi.stubEnv('LIVE_ROOM_SEARCH_DAILY_CAP','1');
 // Models the SQL RPC boundary; not a claim that PostgreSQL concurrency has been tested.
 m.rpc.mockImplementation(async(_name,args)=>{
  const key=args.p_teacher_id+':'+new Date(now).toISOString().slice(0,10);const used=counts.get(key)??0;
  if(used>=args.p_cap)return {error:{message:'SOURCE_LIMIT'}};
  counts.set(key,used+1);return {data:used+1,error:null};
 });
 expect((await search(req(query),{params})).status).toBe(200);
 expect((await search(req(query),{params:{sessionId:teacherId}})).status).toBe(429);
 now='2026-09-29T00:00:00Z';expect((await search(req(query),{params})).status).toBe(200);
 expect(m.search).toHaveBeenCalledTimes(2);
});
it('missing key is clean and spends nothing while reader works',async()=>{
 vi.stubEnv('SERPER_API_KEY','');const result=await search(req(query),{params});
 expect(result.status).toBe(503);expect(await result.json()).toEqual({error:'SEARCH_UNAVAILABLE'});
 expect(m.rpc).not.toHaveBeenCalled();expect((await read(req({url:'https://example.com'}),{params})).status).toBe(200);
});
it.each(['images','news','places','videos'])('routes %s to its normalized adapter',async surface=>{
 expect((await search(req({...query,surface}),{params})).status).toBe(200);
 expect(surface==='places'||surface==='videos'?m.media:m.search).toHaveBeenCalledOnce();
});
it.each([{surface:'images',page:1},{surface:'places',page:1},{surface:'videos',page:1},{page:10},{query:''},{safe:'off'}])('refuses invalid request before quota %j',async patch=>{
 expect((await search(req({...query,...patch}),{params})).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();
});
it('auth and ownership failures do not spend or fetch',async()=>{
 m.auth.mockResolvedValueOnce({teacher:null,error:true});expect((await search(req(query),{params})).status).toBe(401);
 m.own.mockResolvedValue({error:new Response(null,{status:403})});expect((await read(req({url:'https://example.com'}),{params})).status).toBe(403);
 expect(m.rpc).not.toHaveBeenCalled();expect(m.read).not.toHaveBeenCalled();
});
it('feature flag disables both routes without auth/provider calls',async()=>{
 vi.stubEnv('SOURCES_ENABLED','false');expect((await search(req(query),{params})).status).toBe(503);
 expect((await read(req({url:'https://example.com'}),{params})).status).toBe(503);expect(m.auth).not.toHaveBeenCalled();
});
it('provider failure consumes reservation, with no retry/refund',async()=>{
 m.search.mockRejectedValue(new Error('secret'));expect((await search(req(query),{params})).status).toBe(503);
 expect(m.rpc).toHaveBeenCalledOnce();expect(m.search).toHaveBeenCalledOnce();
});
it('unsafe direct URL and cross-origin request never fetch',async()=>{
 expect((await read(req({url:'http://169.254.169.254/'}),{params})).status).toBe(400);
 expect((await search(req(query,'https://evil.example.com'),{params})).status).toBe(403);expect(m.read).not.toHaveBeenCalled();
});
