"""
Digital Twin web app (Gradio) - FREE-FIRST provider bootstrap + universal llm_call() helper.

Mirrors the bootstrap strategy used across:
  1_foundations/2_lab2.ipynb
  1_foundations/3_lab3.ipynb
  1_foundations/4_lab4.ipynb
  1_foundations/5_extra.ipynb

Priority (stable first, since this is a long-running web process):
    1. Gemini FREE tier      - stable model names, lasts for months
    2. OpenRouter FREE       - auto-router model `openrouter/free` CAN'T 404
    3. Groq FREE             - very fast, but they frequently decommission models
    4. Ollama local          - 100% free, no API keys
    5. OpenAI PAID           - last resort (only if no FREE providers available)
"""

import os
import json
import traceback
from dotenv import load_dotenv
from openai import OpenAI, APIError, APIStatusError, NotFoundError, BadRequestError

from context import TWIN_SYSTEM_PROMPT
from tools import tools, handle_tool_calls
from styles import CSS, JS, EXAMPLES
import gradio as gr

load_dotenv(override=True)

# ============================================================
# STEP 1 — FREE-first BOOTSTRAP
# ============================================================
# (Mirrors the bootstrap pattern used in every lab notebook.)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
OLLAMA_BASE_URL = "http://localhost:11434/v1"

_gm_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
_or_key = os.getenv("OPENROUTER_API_KEY")
_gr_key = os.getenv("GROQ_API_KEY")
_oa_key = os.getenv("OPENAI_API_KEY")

# ---------- Decide best FREE provider + set env overrides ----------
if _gm_key:
    _which = "Gemini (FREE tier - STABLE model names)"
    _api_key, _base_url = _gm_key, GEMINI_BASE_URL
    DEFAULT_MODEL = "gemini-2.5-flash"
elif _or_key:
    _which = "OpenRouter (FREE gateway - auto-router can't 404)"
    _api_key, _base_url = _or_key, OPENROUTER_BASE_URL
    DEFAULT_MODEL = "openrouter/free"
elif _gr_key:
    _which = "Groq (FREE tier - fastest inference; note: model names may be decommissioned)"
    _api_key, _base_url = _gr_key, GROQ_BASE_URL
    DEFAULT_MODEL = "llama-4-scout-17b-16e-instruct"   # known-live smaller size; NOT decom 70Bs
elif _oa_key:
    _which = "OpenAI (paid tier - no FREE keys available, using PAID fallback last resort)"
    _api_key, _base_url = _oa_key, None
    DEFAULT_MODEL = "gpt-5.4-mini"   # PAID (last resort only)
else:
    _which = "Ollama (local, 100% FREE - requires: ollama pull llama3.2)"
    _api_key, _base_url = "ollama", OLLAMA_BASE_URL
    DEFAULT_MODEL = "llama3.2"

# Override env vars so bare `OpenAI()` callers still work
os.environ["OPENAI_API_KEY"] = _api_key
if _base_url:
    os.environ["OPENAI_BASE_URL"] = _base_url
elif "OPENAI_BASE_URL" in os.environ:
    del os.environ["OPENAI_BASE_URL"]

# Default client (backwards-compat — any direct reference to `openai` still works)
client_args = {"api_key": _api_key}
if _base_url:
    client_args["base_url"] = _base_url
openai = OpenAI(**client_args)

# ============================================================
# STEP 2 — Multi-model / cross-provider FALLBACK table.
# ============================================================
# This is what makes it resilient: if one model on one provider fails
# (404 / 400 / rate limit / decommissioned), we keep trying the rest
# before finally raising.

MODEL_FALLBACK_CHAIN = [
    # -- Gemini FREE --
    (None if not _gm_key else OpenAI(api_key=_gm_key, base_url=GEMINI_BASE_URL),
     "gemini-2.5-flash",
     "Gemini FREE / gemini-2.5-flash (stable)"),
    (None if not _gm_key else OpenAI(api_key=_gm_key, base_url=GEMINI_BASE_URL),
     "gemini-2.0-flash",
     "Gemini FREE / gemini-2.0-flash (fallback)"),

    # -- OpenRouter FREE --
    (None if not _or_key else OpenAI(api_key=_or_key, base_url=OPENROUTER_BASE_URL),
     "nvidia/nemotron-3-ultra-550b-a55b:free",
     "OpenRouter FREE / Nemotron 3 Ultra 550B"),
    (None if not _or_key else OpenAI(api_key=_or_key, base_url=OPENROUTER_BASE_URL),
     "poolside/laguna-s-2.1:free",
     "OpenRouter FREE / Laguna S 2.1 (coding)"),
    (None if not _or_key else OpenAI(api_key=_or_key, base_url=OPENROUTER_BASE_URL),
     "meta-llama/llama-3.3-70b-instruct:free",
     "OpenRouter FREE / Llama 3.3 70B"),
    (None if not _or_key else OpenAI(api_key=_or_key, base_url=OPENROUTER_BASE_URL),
     "deepseek/deepseek-r1:free",
     "OpenRouter FREE / DeepSeek R1 (reasoning)"),
    (None if not _or_key else OpenAI(api_key=_or_key, base_url=OPENROUTER_BASE_URL),
     "openrouter/free",
     "OpenRouter FREE / auto-router (cannot 404)"),

    # -- Groq FREE --
    (None if not _gr_key else OpenAI(api_key=_gr_key, base_url=GROQ_BASE_URL),
     "llama-4-scout-17b-16e-instruct",
     "Groq FREE / Llama 4 Scout 17B"),
    (None if not _gr_key else OpenAI(api_key=_gr_key, base_url=GROQ_BASE_URL),
     "qwen-2.5-32b",
     "Groq FREE / Qwen 2.5 32B"),
    (None if not _gr_key else OpenAI(api_key=_gr_key, base_url=GROQ_BASE_URL),
     "gemma2-9b-it",
     "Groq FREE / Gemma 2 9B"),
    (None if not _gr_key else OpenAI(api_key=_gr_key, base_url=GROQ_BASE_URL),
     "llama-3.1-8b-instant",
     "Groq FREE / Llama 3.1 8B instant"),

    # -- Ollama local (always present, never decommissions) --
    (OpenAI(api_key="ollama", base_url=OLLAMA_BASE_URL),
     "llama3.2",
     "Ollama local / llama3.2"),
    (OpenAI(api_key="ollama", base_url=OLLAMA_BASE_URL),
     "qwen2.5:3b",
     "Ollama local / qwen2.5:3b"),

    # -- OpenAI PAID (last resort) --
    (None if not _oa_key else OpenAI(api_key=_oa_key),
     "gpt-5.4-mini",
     "OpenAI PAID / gpt-5.4-mini (last resort)"),
    (None if not _oa_key else OpenAI(api_key=_oa_key),
     "gpt-4.1-mini",
     "OpenAI PAID / gpt-4.1-mini (fallback)"),
]

# Filter out entries that don't have a client (i.e. the key wasn't in .env for
# Gemini/OR/Groq/OA). Ollama is always kept (no key needed).
MODEL_FALLBACK_CHAIN = [entry for entry in MODEL_FALLBACK_CHAIN if entry[0] is not None]


# ============================================================
# STEP 3 — Universal llm_call() helper
# ============================================================
# Matches signature used in all lab notebooks:
#   llm_call(messages, *, tools=None, want_response_object=False, verbose=True)
#
# Returns the answer string by default; returns the raw ChatCompletion
# response object when want_response_object=True (needed for tool loops so we
# can inspect .finish_reason and .tool_calls).

_last_provider_used = None


def llm_call(messages, *, tools=None, want_response_object=False, verbose=True):
    """Try every model in MODEL_FALLBACK_CHAIN until one succeeds."""
    global _last_provider_used
    last_exc = None
    tried = 0
    for client, model, label in MODEL_FALLBACK_CHAIN:
        tried += 1
        try:
            kwargs = {"model": model, "messages": messages}
            if tools:
                kwargs["tools"] = tools
            resp = client.chat.completions.create(**kwargs)
            _last_provider_used = label
            if verbose:
                print(f"[llm_call] OK — {label}", flush=True)
            return resp if want_response_object else resp.choices[0].message.content
        except (APIError, APIStatusError, NotFoundError, BadRequestError,
                ConnectionError, TimeoutError, Exception) as exc:
            # Swallow & continue trying the next model in the chain
            last_exc = exc
            if verbose:
                print(f"[llm_call] #{tried} FAIL — {label}: {type(exc).__name__}: {exc}",
                      flush=True)
            continue

    # If we got here, literally every model in the chain failed. Raise aggregated error.
    msg = (
        f"llm_call(): ALL {len(MODEL_FALLBACK_CHAIN)} models in the fallback chain failed.\n"
        f"Last error: {type(last_exc).__name__}: {last_exc}\n"
        f"Models tried: {[label for _, _, label in MODEL_FALLBACK_CHAIN]}"
    )
    if verbose:
        print(f"[llm_call] FATAL:\n{msg}", flush=True)
    raise RuntimeError(msg) from last_exc


# Keep original module-level MODEL_NAME constant for backwards compatibility.
MODEL_NAME = DEFAULT_MODEL

system = [{"role": "system", "content": TWIN_SYSTEM_PROMPT}]


# ============================================================
# STEP 4 — Chat function + tool loop
# ============================================================
# Mirrors the tool loop pattern from 1_foundations/4_lab4.ipynb cell 18
# (and 5_extra.ipynb cell 15):
#   while finish_reason == "tool_calls":
#       results = handle_tool_calls(...)
#       messages.append(assistant_message)
#       messages.extend(results)         <- handle_tool_calls returns full dicts
#       response = llm_call(..., tools=tools, want_response_object=True)

def chat(message, history):
    messages = system + history + [{"role": "user", "content": message}]

    # First turn: invoke LLM with tool schema, raw response object so we can
    # inspect finish_reason / tool_calls.
    try:
        response = llm_call(messages, tools=tools, want_response_object=True)
    except RuntimeError as exc:
        # Every model in the chain failed — show a friendly error to the user
        # (app mustn't crash in production-like Gradio flows).
        return (
            "**⚠️  LLM unavailable right now**\n\n"
            "I couldn't reach any model in my free-tier fallback chain. "
            "This is usually caused by:\n"
            "  - All three cloud providers (Gemini / OpenRouter / Groq) being "
            "rate-limited or down simultaneously, AND\n"
            "  - Ollama not running locally, or `llama3.2` / `qwen2.5:3b` not pulled.\n\n"
            "Quick fixes (pick one):\n"
            "  1. In a terminal run: `ollama pull llama3.2` (then leave Ollama running)\n"
            "  2. Come back in ~1 min and retry (most free tiers use 60-second rate windows).\n\n"
            f"Diagnostic message:\n```\n{exc}\n```"
        )

    # ---------- Tool loop ----------
    try:
        while response.choices[0].finish_reason == "tool_calls":
            message_obj = response.choices[0].message
            tool_calls = message_obj.tool_calls

            # handle_tool_calls() returns COMPLETE `role: tool` dicts already:
            #   [ {"role": "tool", "content": json.dumps(result), "tool_call_id": id}, ... ]
            # We therefore use messages.extend(results) — exact same contract as
            # every lab notebook (4_lab4.ipynb cell 18, 5_extra.ipynb cell 15).
            results = handle_tool_calls(tool_calls)
            messages.append(message_obj)
            messages.extend(results)

            # Next LLM turn — with tools again (multi-step tool chains supported).
            response = llm_call(messages, tools=tools, want_response_object=True)
    except RuntimeError as exc:
        return (
            "**⚠️  Mid-call LLM failure (during tool-use loop)**\n\n"
            "I reached a tool-call step but couldn't complete the agent loop because "
            "every model in my fallback chain failed.\n\n"
            f"Diagnostic:\n```\n{exc}\n```"
        )

    return response.choices[0].message.content


# ============================================================
# STEP 5 — Startup banner
# ============================================================
# Print at module load time (when Gradio launches `python app.py`), mirroring
# the "BOOTSTRAP OK" style used in every lab notebook.

if __name__ == "__main__":
    # (also prints on `import app.py`, which is fine — useful diagnostics.)
    pass


def _startup_banner():
    print()
    print("=" * 72)
    print("DIGITAL TWIN — FREE-FIRST LLM BOOTSTRAP")
    print("=" * 72)
    print(f"Default provider : {_which}")
    print(f"Default model    : {DEFAULT_MODEL}")
    if _base_url:
        print(f"Endpoint         : {_base_url}")
    print(f"Fallback models  : {len(MODEL_FALLBACK_CHAIN)} (cross-provider)")
    print(f"Tool loop        : enabled (2 tools: record_user_details, record_unknown_question)")
    print(f"Pushover keys    : ", end="")
    pu = os.getenv("PUSHOVER_USER")
    pt = os.getenv("PUSHOVER_TOKEN")
    if pu and pt:
        print(f"OK (user=…{pu[-6:]}, token=…{pt[-6:]}) — push notifications will work.")
    else:
        missing = []
        if not pu:
            missing.append("PUSHOVER_USER")
        if not pt:
            missing.append("PUSHOVER_TOKEN")
        print(f"MISSING ({', '.join(missing)}) — record-* tools will run but no push sent.")
    print()
    print("Free-tier priority used:")
    print("  1. Gemini FREE     (stable model names)")
    print("  2. OpenRouter FREE (auto-router can't 404)")
    print("  3. Groq FREE       (fast; note: frequent model decommissions)")
    print("  4. Ollama local    (100% free, no decommissions)")
    print("  5. OpenAI PAID     (last resort only)")
    print("=" * 72)
    print()


_startup_banner()


if __name__ == "__main__":
    gr.ChatInterface(
        chat,
        examples=EXAMPLES,
        title="Digital Twin",
        description="Talk to my AI twin about my career",
        chatbot=gr.Chatbot(show_label=False),
    ).launch(css=CSS, js=JS, theme=gr.themes.Base())
