"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Search, Plus, Volume2, Trash2, LogOut, Sparkles, Languages, Library, GraduationCap } from "lucide-react";

type Example = { id?: string; sentence: string; translation_ar: string; phonetic_us?: string | null; sort_order?: number };
type Entry = { id: string; entry_type: "word" | "sentence"; content: string; translation_ar: string | null; part_of_speech: string | null; phonetic_us: string | null; notes: string | null; created_at: string; english_examples: Example[] };

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [query, setQuery] = useState("");
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState<"word" | "sentence">("word");
  const [translation, setTranslation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [examplesText, setExamplesText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => { if (session) void loadEntries(); }, [session]);

  async function loadEntries() {
    const { data, error } = await supabase.from("english_entries").select("*, english_examples(*)").order("created_at", { ascending: false });
    if (error) { setNotice(error.message); return; }
    setEntries((data ?? []) as Entry[]);
  }

  async function authenticate(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    const action = authMode === "signin" ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password });
    const { error } = await action;
    setBusy(false);
    setNotice(error ? error.message : authMode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Welcome back!");
  }

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true); setNotice("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setBusy(false); return; }
    const { data, error } = await supabase.from("english_entries").insert({
      user_id: userData.user.id, entry_type: entryType, content: content.trim(),
      translation_ar: translation.trim() || null, part_of_speech: partOfSpeech.trim() || null,
      phonetic_us: phonetic.trim() || null
    }).select().single();
    if (error) { setNotice(error.message); setBusy(false); return; }
    const examples = examplesText.split("\n").map(s => s.trim()).filter(Boolean).map((line, i) => {
      const [sentence, ...translationParts] = line.split("|");
      return { entry_id: data.id, sentence: sentence.trim(), translation_ar: translationParts.join("|").trim(), sort_order: i };
    }).filter(x => x.sentence);
    if (examples.length) {
      const { error: exampleError } = await supabase.from("english_examples").insert(examples);
      if (exampleError) setNotice("Saved the entry, but examples could not be saved: " + exampleError.message);
    }
    setContent(""); setTranslation(""); setPartOfSpeech(""); setPhonetic(""); setExamplesText("");
    await loadEntries(); setSelected(data as Entry); setBusy(false);
  }

  async function removeEntry(id: string) {
    if (!confirm("Delete this entry and its examples?")) return;
    const { error } = await supabase.from("english_entries").delete().eq("id", id);
    if (error) setNotice(error.message); else { setSelected(null); await loadEntries(); }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setNotice("Speech playback is not supported in this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === "en-US") ?? null;
    utterance.lang = "en-US"; utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  const filtered = entries.filter(item => (item.content + " " + (item.translation_ar ?? "")).toLowerCase().includes(query.toLowerCase()));
  if (!session) return <main className="auth-page"><div className="auth-card"><div className="brand-mark"><BookOpen size={25}/></div><p className="eyebrow">YOUR PERSONAL LANGUAGE SPACE</p><h1>My English<br/><span>Library.</span></h1><p className="muted">Build your vocabulary, one word at a time.</p><form onSubmit={authenticate} className="stack"><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary" disabled={busy}>{busy ? "Please wait…" : authMode === "signin" ? "Sign in" : "Create account"}</button></form><button className="text-button" onClick={()=>setAuthMode(authMode === "signin" ? "signup" : "signin")}>{authMode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</button>{notice && <p className="notice">{notice}</p>}</div></main>;

  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><BookOpen size={22}/></div><div><b>My English</b><small>LIBRARY</small></div></div><div className="side-label">WORKSPACE</div><div className="side-link active"><Library size={18}/> My collection <span>{entries.length}</span></div><div className="side-link"><GraduationCap size={18}/> Study mode</div><div className="sidebar-bottom"><div className="profile-dot">{session.user.email?.[0]?.toUpperCase()}</div><div className="profile-info"><b>{session.user.email}</b><small>Personal account</small></div><button className="icon-button" title="Sign out" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/></button></div></aside>
    <section className="workspace"><header className="topbar"><div><span className="eyebrow">YOUR KNOWLEDGE, ORGANIZED</span><h2>My collection</h2></div><div className="top-actions"><span className="date-pill">✦ Keep learning every day</span></div></header>
      <div className="content-grid"><section className="main-column"><div className="welcome-panel"><div><span className="eyebrow light">A LITTLE PROGRESS ADDS UP</span><h1>Make every word<br/> <em>count.</em></h1><p>Save the words and phrases you meet. Revisit them whenever you like.</p></div><div className="welcome-art"><BookOpen size={76} strokeWidth={1}/><Sparkles className="sparkle" size={25}/></div></div>
        <div className="section-heading"><div><h3>Your vocabulary</h3><p>{entries.length} saved {entries.length === 1 ? "entry" : "entries"}</p></div><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your library…"/></div></div>
        <div className="entry-list">{filtered.length === 0 ? <div className="empty-state"><BookOpen size={32}/><b>Your library starts here</b><p>Add your first English word or sentence using the form.</p></div> : filtered.map(item=><button className={"entry-row "+(selected?.id===item.id?"chosen":"")} key={item.id} onClick={()=>setSelected(item)}><div className="entry-type">{item.entry_type==="word"?"Aa":"文"}</div><div className="entry-main"><b>{item.content}</b><span>{item.translation_ar || "Translation not added yet"}</span></div><span className="entry-tag">{item.entry_type}</span><span className="entry-arrow">↗</span></button>)}</div>
      </section>
      <aside className="right-column"><div className="form-card"><div className="card-heading"><div className="mini-icon"><Plus size={18}/></div><div><h3>Add to library</h3><p>Capture something new</p></div></div><form onSubmit={saveEntry} className="stack"><div className="type-switch"><button type="button" className={entryType==="word"?"selected":""} onClick={()=>setEntryType("word")}>Word</button><button type="button" className={entryType==="sentence"?"selected":""} onClick={()=>setEntryType("sentence")}>Sentence</button></div><label>English {entryType}<input required value={content} onChange={e=>setContent(e.target.value)} placeholder={entryType==="word"?"e.g. Serendipity":"e.g. I came across an old friend."}/></label><label>Arabic translation<input dir="auto" value={translation} onChange={e=>setTranslation(e.target.value)} placeholder="اكتب الترجمة بالعربي"/></label><label>Part of speech <span className="optional">Optional</span><input value={partOfSpeech} onChange={e=>setPartOfSpeech(e.target.value)} placeholder="Noun, verb, adjective…"/></label><label>American pronunciation <span className="optional">Optional</span><input value={phonetic} onChange={e=>setPhonetic(e.target.value)} placeholder="/ˌser.ənˈdɪp.ə.ti/"/></label><label>Examples <span className="optional">One per line · sentence | Arabic translation</span><textarea rows={3} value={examplesText} onChange={e=>setExamplesText(e.target.value)} placeholder={"It was pure serendipity. | كانت محض صدفة سعيدة."}/></label><button className="primary" disabled={busy}><Plus size={17}/>{busy?"Saving…":"Save to my library"}</button></form><p className="form-hint"><Languages size={14}/> AI translation and example generation will be connected in the next setup step.</p></div>
        {selected && <div className="detail-card"><div className="detail-top"><span className="eyebrow">ENTRY DETAILS</span><button className="icon-button danger" onClick={()=>removeEntry(selected.id)} title="Delete entry"><Trash2 size={16}/></button></div><h3>{selected.content}</h3>{selected.translation_ar && <p className="arabic" dir="auto">{selected.translation_ar}</p>}{selected.part_of_speech && <span className="entry-tag">{selected.part_of_speech}</span>}{selected.phonetic_us && <p className="phonetic">{selected.phonetic_us}</p>}<button className="listen-button" onClick={()=>speak(selected.content)}><Volume2 size={16}/> Listen · US</button>{selected.english_examples?.length>0 && <div className="examples"><b>Examples</b>{selected.english_examples.map((ex,i)=><div className="example" key={ex.id??i}><p>{ex.sentence}</p><small dir="auto">{ex.translation_ar}</small><button className="listen-small" onClick={()=>speak(ex.sentence)} title="Listen to example"><Volume2 size={15}/></button></div>)}</div>}</div>}
      </aside></div><footer>MY ENGLISH LIBRARY <span>•</span> MADE FOR YOUR NEXT WORD</footer>
    </section>
  </main>;
}