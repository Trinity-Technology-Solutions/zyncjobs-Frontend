import{r as o,s as $,v as M,w as B,x as D,y as J,j as e,H as z,E as O,o as F,Z as G,B as K,U as Y,q as _,F as Q,D as Z}from"./index-1OwdLcif.js";import{u as V}from"./useTypewriter-BjJDvQOG.js";import{A as X}from"./arrow-left-Bu0MsVyo.js";import{S as N}from"./sparkles-CDhQDxNF.js";import{R as ee}from"./rotate-ccw-DJCB5LiZ.js";import{U as te}from"./users-YRHpZN37.js";import{T as se}from"./target-BLcgDMSk.js";import{C as ae}from"./chevron-right-CKP52yGC.js";const I=`You are ZyncJobs AI Recruiter Assistant — an expert recruitment automation assistant for employers and HR teams.

You help recruiters with:
- Analyzing candidate profiles and ranking them for job fit
- Optimizing job postings for better candidate attraction
- Generating interview questions tailored to specific roles
- Suggesting screening criteria and evaluation frameworks
- Automating repetitive recruitment tasks
- Providing hiring market insights and salary benchmarks
- Writing offer letters, rejection emails, and follow-up messages
- Creating job descriptions from scratch
- Advising on employer branding and candidate experience

Keep responses concise, professional, and actionable. Use bullet points for lists. Focus on practical recruitment advice.`,R=[{icon:O,label:"Optimize Job Posting",desc:"Improve your JD for better reach",prompt:"Help me optimize my job posting to attract better candidates. What key elements should I include?",color:"from-blue-500 to-blue-600"},{icon:te,label:"Analyze Candidate",desc:"Evaluate & rank applicants",prompt:"How should I evaluate and rank candidates for a software engineer role? What criteria matter most?",color:"from-violet-500 to-violet-600"},{icon:F,label:"Interview Questions",desc:"Generate role-specific questions",prompt:"Generate 10 strong interview questions for a Senior React Developer position including technical and behavioral questions.",color:"from-emerald-500 to-emerald-600"},{icon:G,label:"Screening Criteria",desc:"Set smart filters & red flags",prompt:"What are the best screening criteria and red flags to watch for when hiring a full-stack developer?",color:"from-amber-500 to-amber-600"},{icon:se,label:"Write Job Description",desc:"Create compelling JDs instantly",prompt:"Write a compelling job description for a Data Analyst role at a mid-size tech company with 3-5 years experience required.",color:"from-pink-500 to-pink-600"},{icon:K,label:"Rejection Email",desc:"Professional candidate emails",prompt:"Write a professional and empathetic rejection email template for candidates who were not selected after the interview stage.",color:"from-rose-500 to-rose-600"}],re=h=>{const s=h.toLowerCase();return s.includes("job")&&(s.includes("post")||s.includes("description")||s.includes("optim"))?`Here's how to optimize your job posting:

• **Clear job title** — Use standard titles (e.g., "Senior React Developer" not "Rockstar Coder")
• **Compelling summary** — 2-3 sentences on role impact and team
• **Specific requirements** — Separate "must-have" from "nice-to-have"
• **Salary range** — Posts with salary get 30% more applications
• **Company culture** — Mention work style, benefits, growth opportunities
• **Clear apply process** — Tell candidates exactly what to expect

Want me to write a specific job description for you?`:s.includes("interview")&&s.includes("question")?`Strong interview questions by category:

**Technical:**
• Describe your experience with [specific tech stack]
• Walk me through how you'd architect [specific system]
• How do you handle [specific technical challenge]?

**Behavioral (STAR format):**
• Tell me about a time you missed a deadline — what happened?
• Describe a conflict with a teammate and how you resolved it
• Give an example of a project you're most proud of

**Culture fit:**
• What does your ideal work environment look like?
• How do you stay updated with industry trends?
• Where do you see yourself in 3 years?

Want questions tailored to a specific role?`:s.includes("screen")||s.includes("criteria")||s.includes("evaluat")?`Candidate screening framework:

**Must-have criteria:**
• Core technical skills match (60% weight)
• Years of relevant experience
• Education/certification requirements

**Good-to-have:**
• Industry domain knowledge
• Portfolio/GitHub/work samples
• Communication skills in cover letter

**Red flags to watch:**
• Frequent job hopping (< 1 year per role without reason)
• Vague answers about past responsibilities
• No questions asked during interview
• Inconsistencies between resume and LinkedIn

What role are you screening for? I can give specific criteria.`:s.includes("reject")||s.includes("email")||s.includes("template")?`Professional rejection email template:

---
Subject: Your Application at [Company] — Update

Dear [Candidate Name],

Thank you for taking the time to interview with us for the [Role] position. We genuinely appreciated learning about your background and experience.

After careful consideration, we've decided to move forward with another candidate whose experience more closely aligns with our current needs.

We were impressed by [specific positive] and encourage you to apply for future openings.

Warm regards,
[Your Name]
---

Want me to customize this for a specific stage?`:s.includes("salary")||s.includes("benchmark")||s.includes("pay")?`Salary benchmarking tips:

• **Use multiple sources** — Glassdoor, LinkedIn Salary, AmbitionBox
• **Factor in location** — Bangalore/Mumbai command 20-30% premium
• **Consider total comp** — base + bonus + equity + benefits

**India tech salary ranges (2024):**
• Junior Dev (0-2 yrs): ₹4-8 LPA
• Mid Dev (2-5 yrs): ₹8-18 LPA
• Senior Dev (5-8 yrs): ₹18-35 LPA
• Lead/Architect (8+ yrs): ₹35-60 LPA

What role and location are you benchmarking for?`:`I can help you with that! Here are some key recruitment best practices:

• **Speed matters** — Top candidates are off the market in 10 days
• **Clear communication** — Update candidates at every stage
• **Structured interviews** — Use consistent questions for fair comparison
• **Data-driven decisions** — Track time-to-hire, offer acceptance rate

Could you share more details about your specific challenge?`},pe=({onNavigate:h,user:s})=>{const[c,l]=o.useState([{role:"assistant",content:`Hello${s?.name?` ${s.name.split(" ")[0]}`:""}! 👋 I'm your **AI Recruiter Assistant**.

I can help you streamline your hiring process — from writing job descriptions to evaluating candidates and automating communications.

Select a quick action below or type your question to get started.`,timestamp:new Date}]),[b,C]=o.useState(""),[x,f]=o.useState(!1),[m,T]=o.useState([]),y=o.useRef(null),q=o.useRef(null),w=o.useRef(null),{streamingText:P,isTyping:v,typeText:W}=V();o.useEffect(()=>{const t=async()=>{try{const r=await fetch(Z.JOBS);if(r.ok){const g=(await r.json()).filter(p=>p.postedBy?.toLowerCase()===s?.email?.toLowerCase()||p.employerEmail?.toLowerCase()===s?.email?.toLowerCase());T(g.slice(0,5))}}catch{}};s?.email&&t()},[s]),o.useEffect(()=>{y.current&&(y.current.scrollTop=y.current.scrollHeight)},[c,x]);const j=o.useCallback(async t=>{const r=t.trim();if(!r||x)return;w.current?.abort(),w.current=new AbortController;const u={role:"user",content:r,timestamp:new Date},g=[...c,u];l(g),C(""),f(!0);const p=$("recruiter",r),A=M(p);if(A){l(n=>[...n,{role:"assistant",content:A,timestamp:new Date}]),f(!1);return}const S=m.length>0?`

Employer context — Active jobs: ${m.map(n=>n.jobTitle||n.title).join(", ")}`:"";try{let n=!1,d="";try{const i=await fetch(`${B}/ai-suggestions/career-coach`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:g.map(a=>({role:a.role,content:a.content})),systemPrompt:I+S}),signal:w.current.signal});if(i.ok){const a=await i.json();d=a.reply||a.message||a.content||a.text||a.answer||"",d&&(n=!0)}}catch(i){if(i?.name==="AbortError")return}if(n)D(p,d),l(i=>[...i,{role:"assistant",content:"",timestamp:new Date}]),f(!1),W(d,()=>{l(i=>{const a=[...i];return a[a.length-1]={role:"assistant",content:d,timestamp:new Date},a})});else{l(a=>[...a,{role:"assistant",content:"",timestamp:new Date}]),f(!1);let i="";await J(g.map(a=>({role:a.role,content:a.content})),I+S,a=>{i+=a,l(U=>{const k=[...U];return k[k.length-1]={role:"assistant",content:i,timestamp:new Date},k})},w.current.signal),i&&D(p,i)}}catch(n){if(n?.name==="AbortError")return;l(d=>[...d,{role:"assistant",content:re(r),timestamp:new Date}])}finally{f(!1)}},[c,x,m]),E=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),j(b))},L=()=>{l([{role:"assistant",content:`Hello${s?.name?` ${s.name.split(" ")[0]}`:""}! 👋 I'm your AI Recruiter Assistant. What would you like to work on today?`,timestamp:new Date}])},H=t=>t.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});return e.jsxs("div",{className:"min-h-screen bg-slate-50 flex flex-col",children:[e.jsx(z,{onNavigate:h,user:s}),e.jsx("div",{className:"bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white",children:e.jsxs("div",{className:"max-w-6xl mx-auto px-6 py-8 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("button",{onClick:()=>h?.("employer-dashboard"),className:"flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors mr-1",children:[e.jsx(X,{className:"w-4 h-4"})," Back"]}),e.jsx("div",{className:"w-12 h-12 bg-gradient-to-br from-blue-400 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg",children:e.jsx(N,{className:"w-6 h-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold tracking-tight",children:"AI Recruiter Assistant"}),e.jsx("p",{className:"text-blue-300 text-sm mt-0.5",children:"Powered by AI · Automate your hiring workflow"})]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[m.length>0&&e.jsxs("div",{className:"flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20",children:[e.jsx("div",{className:"w-2 h-2 bg-emerald-400 rounded-full animate-pulse"}),e.jsxs("span",{className:"text-xs text-white/80",children:[m.length," job",m.length>1?"s":""," in context"]})]}),e.jsxs("button",{onClick:L,className:"flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-xl border border-white/20 text-sm text-white transition-colors",children:[e.jsx(ee,{className:"w-3.5 h-3.5"})," New Chat"]})]})]})}),e.jsxs("div",{className:"flex-1 max-w-6xl w-full mx-auto px-6 py-6 flex gap-6",style:{minHeight:0},children:[e.jsx("div",{className:"w-64 flex-shrink-0 hidden lg:block",children:e.jsxs("div",{className:"bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-6",children:[e.jsx("div",{className:"px-4 py-3 border-b border-gray-100 bg-gray-50",children:e.jsx("p",{className:"text-xs font-semibold text-gray-500 uppercase tracking-wider",children:"Quick Actions"})}),e.jsx("div",{className:"p-2 space-y-1",children:R.map((t,r)=>{const u=t.icon;return e.jsxs("button",{onClick:()=>j(t.prompt),className:"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group",children:[e.jsx("div",{className:`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0 shadow-sm`,children:e.jsx(u,{className:"w-4 h-4 text-white"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-gray-800 truncate",children:t.label}),e.jsx("p",{className:"text-xs text-gray-400 truncate",children:t.desc})]}),e.jsx(ae,{className:"w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors"})]},r)})})]})}),e.jsxs("div",{className:"flex-1 flex flex-col min-w-0",style:{height:"calc(100vh - 280px)"},children:[c.length<=1&&e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 lg:hidden flex-shrink-0",children:R.map((t,r)=>{const u=t.icon;return e.jsxs("button",{onClick:()=>j(t.prompt),className:"flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-left hover:border-blue-300 hover:bg-blue-50 transition-colors",children:[e.jsx("div",{className:`w-7 h-7 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0`,children:e.jsx(u,{className:"w-3.5 h-3.5 text-white"})}),e.jsx("span",{className:"text-xs font-medium text-gray-700 truncate",children:t.label})]},r)})}),e.jsxs("div",{ref:y,className:"flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto p-5 space-y-5 mb-3",children:[c.map((t,r)=>e.jsxs("div",{className:`flex gap-3 ${t.role==="user"?"flex-row-reverse":""}`,children:[e.jsx("div",{className:`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${t.role==="assistant"?"bg-gradient-to-br from-blue-500 to-violet-600":"bg-gradient-to-br from-gray-600 to-gray-700"}`,children:t.role==="assistant"?e.jsx(N,{className:"w-4 h-4 text-white"}):e.jsx(Y,{className:"w-4 h-4 text-white"})}),e.jsxs("div",{className:`max-w-[75%] flex flex-col gap-1 ${t.role==="user"?"items-end":"items-start"}`,children:[e.jsxs("div",{className:`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${t.role==="assistant"?"bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100":"bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm"}`,children:[r===c.length-1&&t.role==="assistant"&&v?P:t.content,r===c.length-1&&t.role==="assistant"&&v&&e.jsx("span",{className:"inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle"})]}),e.jsx("span",{className:"text-xs text-gray-400 px-1",children:H(t.timestamp)})]})]},r)),x&&!v&&e.jsxs("div",{className:"flex gap-3",children:[e.jsx("div",{className:"w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm",children:e.jsx(N,{className:"w-4 h-4 text-white"})}),e.jsx("div",{className:"bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm",children:e.jsxs("div",{className:"flex gap-1.5 items-center h-5",children:[e.jsx("span",{className:"w-2 h-2 bg-blue-400 rounded-full animate-bounce",style:{animationDelay:"0ms"}}),e.jsx("span",{className:"w-2 h-2 bg-blue-400 rounded-full animate-bounce",style:{animationDelay:"150ms"}}),e.jsx("span",{className:"w-2 h-2 bg-blue-400 rounded-full animate-bounce",style:{animationDelay:"300ms"}})]})})]})]}),e.jsxs("div",{className:"bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex-shrink-0",children:[e.jsxs("div",{className:"flex gap-3 items-end",children:[e.jsx("textarea",{ref:q,value:b,onChange:t=>C(t.target.value),onKeyDown:E,placeholder:"Ask about candidates, job postings, interview questions...",rows:1,className:"flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 py-1 px-1",style:{lineHeight:"1.6"}}),e.jsx("button",{onClick:()=>j(b),disabled:!b.trim()||x,className:"w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0 shadow-sm",children:e.jsx(_,{className:"w-4 h-4 text-white"})})]}),e.jsx("p",{className:"text-xs text-gray-400 mt-2 px-1",children:"Press Enter to send · Shift+Enter for new line"})]})]})]}),e.jsx(Q,{onNavigate:h})]})};export{pe as default};
