export const CPP_RESULT_SENTINEL = '###ELEVATE_RESULT###';

export const CPP_PREFIX = `
#include <bits/stdc++.h>
using namespace std;

struct JV {
  int t = 0;
  bool b = false;
  double n = 0;
  string s;
  vector<JV> a;
  map<string, JV> o;
};

struct JParser {
  const string& src;
  size_t i = 0;
  explicit JParser(const string& x) : src(x) {}
  void ws() { while (i < src.size() && (src[i] == ' ' || src[i] == '\\t' || src[i] == '\\n' || src[i] == '\\r')) i++; }
  JV parse() { ws(); return val(); }
  JV val() {
    ws();
    if (i >= src.size()) return JV{};
    char c = src[i];
    if (c == '[') return arr();
    if (c == '{') return obj();
    if (c == '"') { JV v; v.t = 3; v.s = str(); return v; }
    if (c == 't') { i += 4; JV v; v.t = 1; v.b = true; return v; }
    if (c == 'f') { i += 5; JV v; v.t = 1; v.b = false; return v; }
    if (c == 'n') { i += 4; JV v; v.t = 0; return v; }
    return num();
  }
  string str() {
    string out;
    i++;
    while (i < src.size() && src[i] != '"') {
      char c = src[i++];
      if (c == '\\\\' && i < src.size()) {
        char e = src[i++];
        if (e == 'n') out.push_back('\\n');
        else if (e == 't') out.push_back('\\t');
        else if (e == 'r') out.push_back('\\r');
        else if (e == 'b') out.push_back('\\b');
        else if (e == 'f') out.push_back('\\f');
        else if (e == 'u') { i += 4; out.push_back('?'); }
        else out.push_back(e);
      } else {
        out.push_back(c);
      }
    }
    i++;
    return out;
  }
  JV num() {
    size_t start = i;
    while (i < src.size() && (isdigit(src[i]) || src[i] == '-' || src[i] == '+' || src[i] == '.' || src[i] == 'e' || src[i] == 'E')) i++;
    JV v; v.t = 2; v.n = strtod(src.substr(start, i - start).c_str(), nullptr); return v;
  }
  JV arr() {
    JV v; v.t = 4; i++;
    ws();
    if (i < src.size() && src[i] == ']') { i++; return v; }
    while (i < src.size()) {
      v.a.push_back(val());
      ws();
      if (i < src.size() && src[i] == ',') { i++; continue; }
      if (i < src.size() && src[i] == ']') { i++; break; }
      break;
    }
    return v;
  }
  JV obj() {
    JV v; v.t = 5; i++;
    ws();
    if (i < src.size() && src[i] == '}') { i++; return v; }
    while (i < src.size()) {
      ws();
      string key = str();
      ws();
      if (i < src.size() && src[i] == ':') i++;
      v.o[key] = val();
      ws();
      if (i < src.size() && src[i] == ',') { i++; continue; }
      if (i < src.size() && src[i] == '}') { i++; break; }
      break;
    }
    return v;
  }
};

static int __toInt(const JV& v) { return (int)llround(v.n); }
static long long __toLong(const JV& v) { return (long long)llround(v.n); }
static double __toDouble(const JV& v) { return v.n; }
static bool __toBool(const JV& v) { return v.b; }
static string __toStr(const JV& v) { return v.s; }
static vector<int> __toVecInt(const JV& v) { vector<int> r; for (auto& e : v.a) r.push_back((int)llround(e.n)); return r; }
static vector<long long> __toVecLong(const JV& v) { vector<long long> r; for (auto& e : v.a) r.push_back((long long)llround(e.n)); return r; }
static vector<double> __toVecDouble(const JV& v) { vector<double> r; for (auto& e : v.a) r.push_back(e.n); return r; }
static vector<bool> __toVecBool(const JV& v) { vector<bool> r; for (auto& e : v.a) r.push_back(e.b); return r; }
static vector<string> __toVecStr(const JV& v) { vector<string> r; for (auto& e : v.a) r.push_back(e.s); return r; }
static vector<vector<int>> __toVecVecInt(const JV& v) { vector<vector<int>> r; for (auto& e : v.a) r.push_back(__toVecInt(e)); return r; }

static string __jsonEscape(const string& s) {
  string out = "\\"";
  for (char c : s) {
    if (c == '"') out += "\\\\\\"";
    else if (c == '\\\\') out += "\\\\\\\\";
    else if (c == '\\n') out += "\\\\n";
    else if (c == '\\t') out += "\\\\t";
    else if (c == '\\r') out += "\\\\r";
    else out.push_back(c);
  }
  out += "\\"";
  return out;
}

static string __ser(bool x) { return x ? "true" : "false"; }
static string __ser(int x) { return to_string(x); }
static string __ser(long long x) { return to_string(x); }
static string __ser(double x) { char buf[64]; snprintf(buf, sizeof(buf), "%.10g", x); return string(buf); }
static string __ser(const string& x) { return __jsonEscape(x); }
template <typename T> static string __ser(const vector<T>& v) {
  string out = "[";
  for (size_t k = 0; k < v.size(); k++) { if (k) out += ","; out += __ser(v[k]); }
  out += "]";
  return out;
}
static string __ser(const vector<bool>& v) {
  string out = "[";
  for (size_t k = 0; k < v.size(); k++) { if (k) out += ","; out += (v[k] ? "true" : "false"); }
  out += "]";
  return out;
}

static long long __peakMemoryKb() {
  ifstream f("/proc/self/status");
  string line;
  while (getline(f, line)) {
    if (line.rfind("VmHWM:", 0) == 0) {
      long long kb = 0;
      sscanf(line.c_str(), "VmHWM: %lld", &kb);
      return kb;
    }
  }
  return 0;
}
`;

export const CPP_MAIN = `
int main() {
  ifstream __f("/sandbox/cases.json");
  stringstream __ss;
  __ss << __f.rdbuf();
  string __content = __ss.str();
  JParser __cp(__content);
  JV __cases = __cp.parse();
  const string __sentinel = "${CPP_RESULT_SENTINEL}";
  for (auto& __tc : __cases.a) {
    string __id = __tc.o.count("id") ? __tc.o["id"].s : "";
    string __input = __tc.o.count("input") ? __tc.o["input"].s : "";
    string __line;
    auto __start = chrono::high_resolution_clock::now();
    try {
      string __argText = "[" + __input + "]";
      JParser __ap(__argText);
      JV __args = __ap.parse();
      string __out = __elevate_invoke(__args);
      auto __end = chrono::high_resolution_clock::now();
      double __ms = chrono::duration<double, milli>(__end - __start).count();
      __line = string("{") + "\\"caseId\\":" + __jsonEscape(__id) + ",\\"status\\":\\"ok\\",\\"output\\":" + __jsonEscape(__out) + ",\\"runtimeMs\\":" + __ser(__ms) + ",\\"peakMemoryKb\\":" + __ser((long long)__peakMemoryKb()) + "}";
    } catch (exception& __e) {
      auto __end = chrono::high_resolution_clock::now();
      double __ms = chrono::duration<double, milli>(__end - __start).count();
      __line = string("{") + "\\"caseId\\":" + __jsonEscape(__id) + ",\\"status\\":\\"error\\",\\"error\\":" + __jsonEscape(string(__e.what())) + ",\\"runtimeMs\\":" + __ser(__ms) + ",\\"peakMemoryKb\\":" + __ser((long long)__peakMemoryKb()) + "}";
    }
    cout << __sentinel << __line << "\\n";
  }
  return 0;
}
`;
