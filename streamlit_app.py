import os
from datetime import datetime, timezone

import pandas as pd
import streamlit as st
from supabase import Client, create_client


st.set_page_config(
    page_title="Iraq EFU Monitor",
    page_icon=":satellite:",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    [data-testid="stAppViewContainer"] { direction: rtl; }
    [data-testid="stSidebar"] { direction: rtl; }
    .metric-card { padding: 14px 16px; border: 1px solid #d9e1e8; border-radius: 8px; background: #f8fafc; }
    </style>
    """,
    unsafe_allow_html=True,
)


def secret(name: str, default: str = "") -> str:
    try:
        return str(st.secrets.get(name, os.getenv(name, default)))
    except Exception:
        return os.getenv(name, default)


@st.cache_resource
def get_client() -> Client:
    url = secret("SUPABASE_URL") or secret("NEXT_PUBLIC_SUPABASE_URL")
    key = secret("SUPABASE_KEY") or secret("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    if not url or not key:
        raise RuntimeError("أضف SUPABASE_URL و SUPABASE_KEY إلى Secrets في Streamlit Cloud.")
    return create_client(url, key)


@st.cache_data(ttl=30)
def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    client = get_client()
    cases = client.table("cases").select("*").order("created_at", desc=True).execute().data or []
    provinces = client.table("provinces").select("id,name,name_ar,code").execute().data or []
    return pd.DataFrame(cases), pd.DataFrame(provinces)


def is_active(cases: pd.DataFrame) -> pd.Series:
    archived = cases.get("archived_at", pd.Series(index=cases.index)).isna()
    closed = cases.get("closed_at", pd.Series(index=cases.index)).isna()
    escalation = cases.get("escalation", pd.Series("OPEN", index=cases.index)).fillna("OPEN").str.upper()
    return archived & closed & escalation.ne("CLOSED")


def hours_old(value: object) -> float:
    try:
        created = pd.to_datetime(value, utc=True)
        return max(0.0, (datetime.now(timezone.utc) - created).total_seconds() / 3600)
    except (TypeError, ValueError):
        return 0.0


st.title("مراقبة عمليات EFU في العراق")
st.caption("لوحة Streamlit متصلة بقاعدة بيانات Supabase | تحديث تلقائي للبيانات كل 30 ثانية")

try:
    cases, provinces = load_data()
except Exception as error:
    st.error(str(error))
    st.stop()

if cases.empty:
    st.info("لا توجد حالات في قاعدة البيانات.")
    st.stop()

active = cases[is_active(cases)].copy()
active["efu"] = pd.to_numeric(active.get("efu", 0), errors="coerce").fillna(0)
active["affected_users"] = pd.to_numeric(active.get("affected_users", 0), errors="coerce").fillna(0)
active["age_hours"] = active["created_at"].map(hours_old)

with st.sidebar:
    st.header("الفلاتر")
    search = st.text_input("بحث", placeholder="رقم الحالة أو المنطقة أو الوصف")
    priorities = st.multiselect("الأولوية", sorted(active["priority"].dropna().unique()))
    statuses = st.multiselect("الحالة", sorted(active["status"].dropna().unique()))
    regions = st.multiselect("المنطقة", sorted(active["region"].dropna().unique()))
    age_limit = st.selectbox("عمر الحالة", ["الكل", "أكثر من 4 ساعات", "أكثر من 8 ساعات", "أكثر من 24 ساعة"])
    if st.button("تحديث البيانات", use_container_width=True):
        load_data.clear()
        st.rerun()

filtered = active.copy()
if search:
    searchable = filtered.fillna("").astype(str).agg(" ".join, axis=1).str.lower()
    filtered = filtered[searchable.str.contains(search.lower(), regex=False)]
if priorities:
    filtered = filtered[filtered["priority"].isin(priorities)]
if statuses:
    filtered = filtered[filtered["status"].isin(statuses)]
if regions:
    filtered = filtered[filtered["region"].isin(regions)]
if age_limit != "الكل":
    minimum = {"أكثر من 4 ساعات": 4, "أكثر من 8 ساعات": 8, "أكثر من 24 ساعة": 24}[age_limit]
    filtered = filtered[filtered["age_hours"] >= minimum]

metrics = st.columns(5)
metrics[0].metric("كل الحالات", len(cases))
metrics[1].metric("الحالات النشطة", len(active))
metrics[2].metric("إجمالي EFU", f"{int(active['efu'].sum()):,}")
metrics[3].metric("المستخدمون المتأثرون", f"{int(active['affected_users'].sum()):,}")
metrics[4].metric("حرجة", int(((active["priority"] == "CRITICAL") | (active["efu"] >= 200)).sum()))

left, right = st.columns([1.35, 1])
with left:
    st.subheader(f"الحالات ذات الأولوية ({len(filtered)})")
    display = filtered.sort_values(["priority", "age_hours"], ascending=[True, False]).copy()
    columns = ["case_id", "priority", "status", "region", "fdt", "efu", "affected_users", "created_at"]
    available = [column for column in columns if column in display.columns]
    st.dataframe(display[available], use_container_width=True, hide_index=True)

with right:
    st.subheader("التوزيع حسب المحافظة")
    if not provinces.empty and "province_id" in active.columns:
        province_view = active.merge(provinces, left_on="province_id", right_on="id", how="left")
        province_view["province"] = province_view["name_ar"].fillna(province_view["region"])
        summary = province_view.groupby("province", dropna=False).agg(
            الحالات=("case_id", "count"), EFU=("efu", "sum"), المتأثرون=("affected_users", "sum")
        ).sort_values("EFU", ascending=False)
        st.dataframe(summary, use_container_width=True)
    else:
        st.info("لا تتوفر بيانات المحافظات.")

st.subheader("تفاصيل آخر الحالات")
for _, row in filtered.head(10).iterrows():
    title = f"{row.get('case_id', 'بدون رقم')} | {row.get('priority', 'MEDIUM')} | EFU {int(row.get('efu', 0))}"
    with st.expander(title):
        st.write(row.get("description", "لا يوجد وصف"))
        st.json({
            "المنطقة": row.get("region"),
            "FDT": row.get("fdt"),
            "الحالة": row.get("status"),
            "التصعيد": row.get("escalation"),
            "تاريخ الإنشاء": row.get("created_at"),
        })