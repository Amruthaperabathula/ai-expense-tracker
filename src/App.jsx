import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Health", "Entertainment", "Other"];
const CATEGORY_ICONS = { Food: "🍜", Travel: "✈️", Shopping: "🛍️", Bills: "💡", Health: "💊", Entertainment: "🎬", Other: "📦" };
const CATEGORY_COLORS = { Food: "#FF6B6B", Travel: "#4ECDC4", Shopping: "#FFE66D", Bills: "#A8DADC", Health: "#95D5B2", Entertainment: "#C77DFF", Other: "#ADB5BD" };

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().split("T")[0];

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([
    { id: 1, description: "Lunch at cafe", amount: 180, category: "Food", date: "2026-05-28" },
    { id: 2, description: "Metro card recharge", amount: 500, category: "Travel", date: "2026-05-27" },
    { id: 3, description: "Electricity bill", amount: 1200, category: "Bills", date: "2026-05-25" },
    { id: 4, description: "Groceries", amount: 650, category: "Food", date: "2026-05-24" },
    { id: 5, description: "Movie tickets", amount: 400, category: "Entertainment", date: "2026-05-23" },
  ]);

  const [form, setForm] = useState({ description: "", amount: "", category: "Food", date: today() });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState("expenses");

  // ── Stage 3: AI Chat States ──
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your AI expense assistant 🤖 Ask me anything about your spending! Try: 'Where am I overspending?' or 'Give me saving tips'" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = CATEGORIES.map(cat => ({
    name: cat,
    amount: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    icon: CATEGORY_ICONS[cat],
    color: CATEGORY_COLORS[cat],
  })).filter(c => c.amount > 0);

  const topCategory = categoryTotals.length > 0
    ? categoryTotals.reduce((a, b) => a.amount > b.amount ? a : b)
    : null;

  const handleAdd = () => {
    if (!form.description.trim()) return setError("Please enter a description.");
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return setError("Enter a valid amount.");
    if (!form.date) return setError("Please select a date.");
    setError("");
    setExpenses([{ id: Date.now(), ...form, amount: Number(form.amount) }, ...expenses]);
    setForm({ description: "", amount: "", category: "Food", date: today() });
    setShowForm(false);
  };

  const handleDelete = (id) => { setExpenses(expenses.filter(e => e.id !== id)); setDeleteId(null); };

  // ── Stage 3: AI Chat Function ──
  const handleAskAI = async () => {
    if (!userInput.trim()) return;

    const question = userInput.trim();
    setUserInput("");
    setMessages(prev => [...prev, { role: "user", text: question }]);
    setAiLoading(true);

    // Build expense summary to send to AI
    const expenseSummary = expenses.map(e =>
      `- ${e.description}: ₹${e.amount} (${e.category}) on ${formatDate(e.date)}`
    ).join("\n");

    const categoryBreakdown = categoryTotals.map(c =>
      `${c.name}: ₹${c.amount} (${Math.round(c.amount / total * 100)}%)`
    ).join(", ");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a helpful personal finance assistant. The user has shared their expense data with you. 
          Analyze their spending and give practical, friendly advice in 3-4 sentences max.
          Always respond in a helpful, encouraging tone. Use ₹ for Indian Rupees.
          
          Here is their expense data:
          Total Spent: ₹${total}
          
          All Expenses:
          ${expenseSummary}
          
          Category Breakdown: ${categoryBreakdown}`,
          messages: [{ role: "user", content: question }]
        })
      });

      const data = await response.json();
      const aiReply = data.content[0].text;
      setMessages(prev => [...prev, { role: "assistant", text: aiReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't connect right now. Please try again!" }]);
    }

    setAiLoading(false);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "#1A1A2E", border: "1px solid #ffffff20", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ margin: 0, color: "#fff", fontWeight: 600 }}>₹{payload[0].value.toLocaleString("en-IN")}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F13", fontFamily: "'DM Sans', sans-serif", color: "#EAEAEA", paddingBottom: 60 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)", padding: "32px 24px 28px", borderBottom: "1px solid #ffffff10" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{ color: "#ffffff40", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>MY WALLET</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Expense Tracker</h1>

          {/* Total Card */}
          <div style={{ marginTop: 24, background: "linear-gradient(135deg, #6C63FF, #C77DFF)", borderRadius: 20, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>TOTAL SPENT</p>
              <p style={{ margin: "4px 0 0", fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800 }}>₹{total.toLocaleString("en-IN")}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{expenses.length} expenses</p>
              {topCategory && <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Top: {topCategory.icon} {topCategory.name}</p>}
            </div>
          </div>

          {/* Summary Pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto", paddingBottom: 4 }}>
            {categoryTotals.map(c => (
              <div key={c.name} style={{ flexShrink: 0, background: c.color + "22", border: `1px solid ${c.color}44`, borderRadius: 12, padding: "8px 14px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 16 }}>{c.icon}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: c.color, fontWeight: 600 }}>{c.name}</p>
                <p style={{ margin: "1px 0 0", fontSize: 12, fontWeight: 700 }}>₹{c.amount.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* Tab Switcher — now 3 tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 20, background: "#1A1A2E", borderRadius: 14, padding: 4 }}>
          {["expenses", "charts", "ai"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
              background: activeTab === tab ? "#6C63FF" : "transparent",
              color: activeTab === tab ? "#fff" : "#ffffff50",
              fontWeight: 600, fontSize: 13, transition: "all 0.2s"
            }}>
              {tab === "expenses" ? "📋" : tab === "charts" ? "📊" : "🤖"}
            </button>
          ))}
        </div>

        {/* ════ EXPENSES TAB ════ */}
        {activeTab === "expenses" && (
          <>
            <button onClick={() => { setShowForm(!showForm); setError(""); }} style={{
              width: "100%", marginTop: 14, padding: "14px",
              background: showForm ? "#1E1E2E" : "#6C63FF",
              color: "#fff", border: showForm ? "1px solid #6C63FF" : "none",
              borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}>
              {showForm ? "✕ Cancel" : "+ Add New Expense"}
            </button>

            {showForm && (
              <div style={{ marginTop: 12, background: "#1A1A2E", borderRadius: 20, padding: "20px", border: "1px solid #ffffff10" }}>
                <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
                <label style={{ fontSize: 12, color: "#ffffff60", letterSpacing: 1 }}>DESCRIPTION</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Lunch at Zomato"
                  style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "12px 14px", background: "#0F0F1A", border: "1px solid #ffffff15", borderRadius: 10, color: "#EAEAEA", fontSize: 14, outline: "none", boxSizing: "border-box" }} />

                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#ffffff60", letterSpacing: 1 }}>AMOUNT (₹)</label>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0"
                      style={{ width: "100%", marginTop: 6, padding: "12px 14px", background: "#0F0F1A", border: "1px solid #ffffff15", borderRadius: 10, color: "#EAEAEA", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#ffffff60", letterSpacing: 1 }}>DATE</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "12px 14px", background: "#0F0F1A", border: "1px solid #ffffff15", borderRadius: 10, color: "#EAEAEA", fontSize: 14, outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                  </div>
                </div>

                <label style={{ fontSize: 12, color: "#ffffff60", letterSpacing: 1 }}>CATEGORY</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 16 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setForm({ ...form, category: cat })} style={{
                      padding: "7px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                      border: form.category === cat ? "none" : "1px solid #ffffff20",
                      background: form.category === cat ? CATEGORY_COLORS[cat] : "transparent",
                      color: form.category === cat ? "#000" : "#ffffff80",
                      fontWeight: form.category === cat ? 600 : 400
                    }}>{CATEGORY_ICONS[cat]} {cat}</button>
                  ))}
                </div>

                {error && <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 12 }}>⚠ {error}</p>}
                <button onClick={handleAdd} style={{ width: "100%", padding: "14px", background: "#6C63FF", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Save Expense</button>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Recent Expenses</h2>
              {expenses.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#ffffff30" }}>
                  <p style={{ fontSize: 40 }}>💸</p><p>No expenses yet. Add one!</p>
                </div>
              )}
              {expenses.map(exp => (
                <div key={exp.id} style={{ background: "#1A1A2E", borderRadius: 16, padding: "16px", marginBottom: 10, border: "1px solid #ffffff08", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: CATEGORY_COLORS[exp.category] + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: `1px solid ${CATEGORY_COLORS[exp.category]}33` }}>
                    {CATEGORY_ICONS[exp.category]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exp.description}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "#ffffff50" }}>
                      <span style={{ color: CATEGORY_COLORS[exp.category], fontWeight: 500 }}>{exp.category}</span>{" · "}{formatDate(exp.date)}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>₹{exp.amount.toLocaleString("en-IN")}</p>
                  {deleteId === exp.id ? (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => handleDelete(exp.id)} style={{ padding: "5px 10px", background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Yes</button>
                      <button onClick={() => setDeleteId(null)} style={{ padding: "5px 10px", background: "#ffffff15", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(exp.id)} style={{ background: "none", border: "none", color: "#ffffff30", cursor: "pointer", fontSize: 18, padding: "4px", flexShrink: 0 }}>🗑</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ CHARTS TAB ════ */}
        {activeTab === "charts" && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: "#1A1A2E", borderRadius: 20, padding: "20px", marginBottom: 16, border: "1px solid #ffffff08" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Spending by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryTotals} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                    {categoryTotals.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, justifyContent: "center" }}>
                {categoryTotals.map(c => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
                    <span style={{ fontSize: 12, color: "#ffffff80" }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#1A1A2E", borderRadius: 20, padding: "20px", marginBottom: 16, border: "1px solid #ffffff08" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Amount per Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryTotals} margin={{ left: -10 }}>
                  <XAxis dataKey="name" tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff50", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {categoryTotals.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#1A1A2E", borderRadius: 20, padding: "20px", border: "1px solid #ffffff08" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Breakdown</h3>
              {categoryTotals.sort((a, b) => b.amount - a.amount).map(c => (
                <div key={c.name} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.icon} {c.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>₹{c.amount.toLocaleString("en-IN")} <span style={{ color: "#ffffff40", fontWeight: 400 }}>({Math.round(c.amount / total * 100)}%)</span></span>
                  </div>
                  <div style={{ height: 6, background: "#ffffff10", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${(c.amount / total) * 100}%`, background: c.color, borderRadius: 99, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ AI CHAT TAB ════ */}
        {activeTab === "ai" && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: "#1A1A2E", borderRadius: 20, padding: "16px", border: "1px solid #ffffff08", marginBottom: 12 }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>🤖 AI Assistant</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#ffffff50" }}>Ask anything about your spending</p>
            </div>

            {/* Suggestion chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {["Where am I overspending?", "Give me saving tips", "Analyse my spending"].map(q => (
                <button key={q} onClick={() => setUserInput(q)} style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: "1px solid #6C63FF44", background: "#6C63FF22",
                  color: "#C77DFF", fontWeight: 500
                }}>{q}</button>
              ))}
            </div>

            {/* Chat Messages */}
            <div style={{ background: "#1A1A2E", borderRadius: 20, padding: "16px", border: "1px solid #ffffff08", minHeight: 300, maxHeight: 400, overflowY: "auto", marginBottom: 12 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "#6C63FF" : "#0F0F1A",
                    border: msg.role === "assistant" ? "1px solid #ffffff10" : "none",
                    fontSize: 13, lineHeight: 1.5
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                  <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#0F0F1A", border: "1px solid #ffffff10", fontSize: 13, color: "#ffffff50" }}>
                    Thinking... 🤔
                  </div>
                </div>
              )}
            </div>

            {/* Input Box */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAskAI()}
                placeholder="Ask about your expenses..."
                style={{ flex: 1, padding: "12px 16px", background: "#1A1A2E", border: "1px solid #ffffff15", borderRadius: 12, color: "#EAEAEA", fontSize: 14, outline: "none" }}
              />
              <button onClick={handleAskAI} disabled={aiLoading} style={{
                padding: "12px 20px", background: "#6C63FF", color: "#fff",
                border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1
              }}>Send</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
