const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').resolve(__dirname,'../index.html'),'utf8');
const moduleCode=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s*["'][^"']+["'];/g,'');
const memory=new Map(),auth={currentUser:null,authStateReady:async()=>{}},events=[],writes=[];
function user(uid,email,isAnonymous=false){return {uid,email,isAnonymous,displayName:''};}
const context={console:{log(){},warn(){},error(){}},Event:class{constructor(type){this.type=type;}},window:{Store:{set:(k,v)=>memory.set(k,v),remove:k=>memory.delete(k)},dispatchEvent:e=>events.push(e.type)},
initializeApp:config=>({options:config}),analyticsIsSupported:async()=>false,getAnalytics(){},
getFirestore:()=>({}),getAuth:()=>auth,getStorage:()=>({}),
collection:(db,n)=>n,doc:(db,col,id)=>col+'/'+id,
setDoc:async(p,d)=>{writes.push(p);memory.set(p,d);},
getDoc:async p=>({exists:()=>memory.has(p),data:()=>memory.get(p)}),
serverTimestamp:()=> 'SERVER_TIME',addDoc(){},updateDoc(){},query(){},orderBy(){},where(){},onSnapshot(){},
onAuthStateChanged:(a,callback)=>{},setPersistence:async(a,p)=>{auth.persistence=p;},browserLocalPersistence:'local',browserSessionPersistence:'session',
signInWithEmailAndPassword:async(a,email,password)=>{if(password==='bad')throw {code:'auth/invalid-credential'};a.currentUser=user('alice',email);return {user:a.currentUser};},
createUserWithEmailAndPassword:async(a,email,password)=>{a.currentUser=user('new-user',email);return {user:a.currentUser};},
fbSignOut:async a=>{a.currentUser=null;},
signInAnonymously:async a=>{a.currentUser=user('guest',null,true);return {user:a.currentUser};},
linkWithCredential:async(u,c)=>{u.email=c.email;u.isAnonymous=false;return {user:u};},
EmailAuthProvider:{credential:(email,password)=>({email,password})},
updateProfile:async(u,p)=>Object.assign(u,p),sendPasswordResetEmail(){},
GoogleAuthProvider:class{setCustomParameters(){}},signInWithPopup(){},linkWithPopup(){},
storageRef(){},uploadBytes(){},getDownloadURL(){}
};
vm.createContext(context);vm.runInContext(moduleCode,context);
const fb=context.window.LCFB;let count=0;
function check(name,v){assert.ok(v,name);console.log('PASS '+(++count)+' '+name);}
(async()=>{
check('Firebase project and helpers initialize',fb.ready===true);
const profile=await fb.lcRegister({name:'Alice',email:'alice@example.com',password:'valid-password'});
check('Registration writes correctly scoped profile',writes[0]==='users/new-user'&&profile.uid==='new-user');
check('Profile timestamp uses server timestamp',memory.get('users/new-user').createdAt==='SERVER_TIME');
await fb.lcLogout();await fb.lcRefreshSession();check('Logout clears profile and role',!context.window.LCSession.uid&&!memory.has('user'));
const guest=await fb.lcEnsureOrderUser();check('Guest checkout authenticates anonymously',guest.isAnonymous&&guest.uid==='guest');
const linked=await fb.lcRegister({name:'Guest Alice',email:'guest@example.com',password:'valid-password'});check('Guest registration preserves order ownership UID',linked.uid==='guest');
memory.set('users/alice',{name:'Alice',email:'alice@example.com',phone:''});
const login=await fb.lcLogin({email:'alice@example.com',password:'valid-password'});await fb.lcRefreshSession();
check('Login restores matching Firestore profile',login.uid==='alice'&&memory.get('user').uid==='alice');
check('Customer does not acquire admin rights',context.window.LCSession.isAdmin===false);
memory.set('admins/alice',{enabled:true});await fb.lcRefreshSession();check('Enabled admin role is loaded from Firestore',context.window.LCSession.isAdmin===true);
await fb.lcSetPersistence(false);check('Remember-me off uses session persistence',auth.persistence==='session');
await fb.lcSetPersistence(true);check('Remember-me on uses local Firebase Auth persistence',auth.persistence==='local');
let rejected=false;try{await fb.lcLogin({email:'alice@example.com',password:'bad'});}catch(e){rejected=e.code==='auth/invalid-credential';}check('Invalid credentials propagate failure',rejected);
await fb.lcLogout();await fb.lcRefreshSession();check('Logout clears admin authorization',context.window.LCSession.isAdmin===false&&!context.window.LCSession.uid);
console.log('ALL '+count+' MOCK AUTH TESTS PASSED');
})().catch(e=>{console.error(e);process.exitCode=1;});
