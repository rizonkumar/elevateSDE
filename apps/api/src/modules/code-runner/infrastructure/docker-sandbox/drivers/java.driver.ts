export const JAVA_RESULT_SENTINEL = '###ELEVATE_RESULT###';

export const JAVA_IMPORTS = `import java.util.*;
import java.util.function.*;
import java.util.stream.*;
import java.io.*;
import java.math.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
`;

export const JAVA_MAIN = String.raw`
public class Main {
  static final class ElevateJson {
    private final String src;
    private int i = 0;

    ElevateJson(String src) {
      this.src = src;
    }

    Object parse() {
      ws();
      return val();
    }

    private void ws() {
      while (i < src.length() && Character.isWhitespace(src.charAt(i))) i++;
    }

    private Object val() {
      ws();
      if (i >= src.length()) return null;
      char c = src.charAt(i);
      if (c == '[') return arr();
      if (c == '{') return obj();
      if (c == '"') return str();
      if (src.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
      if (src.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
      if (src.startsWith("null", i)) { i += 4; return null; }
      return num();
    }

    private String str() {
      StringBuilder out = new StringBuilder();
      i++;
      while (i < src.length() && src.charAt(i) != '"') {
        char c = src.charAt(i++);
        if (c == '\\' && i < src.length()) {
          char e = src.charAt(i++);
          switch (e) {
            case 'n': out.append('\n'); break;
            case 't': out.append('\t'); break;
            case 'r': out.append('\r'); break;
            case 'b': out.append('\b'); break;
            case 'f': out.append('\f'); break;
            case 'u':
              out.append((char) Integer.parseInt(src.substring(i, Math.min(i + 4, src.length())), 16));
              i += 4;
              break;
            default: out.append(e);
          }
        } else {
          out.append(c);
        }
      }
      i++;
      return out.toString();
    }

    private Double num() {
      int start = i;
      while (i < src.length() && "+-0123456789.eE".indexOf(src.charAt(i)) >= 0) i++;
      return Double.parseDouble(src.substring(start, i));
    }

    private List<Object> arr() {
      List<Object> out = new ArrayList<>();
      i++;
      ws();
      if (i < src.length() && src.charAt(i) == ']') { i++; return out; }
      while (i < src.length()) {
        out.add(val());
        ws();
        if (i < src.length() && src.charAt(i) == ',') { i++; continue; }
        if (i < src.length() && src.charAt(i) == ']') { i++; break; }
        break;
      }
      return out;
    }

    private Map<String, Object> obj() {
      Map<String, Object> out = new LinkedHashMap<>();
      i++;
      ws();
      if (i < src.length() && src.charAt(i) == '}') { i++; return out; }
      while (i < src.length()) {
        ws();
        String key = str();
        ws();
        if (i < src.length() && src.charAt(i) == ':') i++;
        out.put(key, val());
        ws();
        if (i < src.length() && src.charAt(i) == ',') { i++; continue; }
        if (i < src.length() && src.charAt(i) == '}') { i++; break; }
        break;
      }
      return out;
    }
  }

  @SuppressWarnings("unchecked")
  static List<Object> __list(Object v) { return (List<Object>) v; }
  static int __toInt(Object v) { return (int) Math.round(((Number) v).doubleValue()); }
  static long __toLong(Object v) { return Math.round(((Number) v).doubleValue()); }
  static double __toDouble(Object v) { return ((Number) v).doubleValue(); }
  static boolean __toBool(Object v) { return (Boolean) v; }
  static String __toStr(Object v) { return (String) v; }
  static int[] __toIntArr(Object v) { List<Object> l = __list(v); int[] r = new int[l.size()]; for (int k = 0; k < r.length; k++) r[k] = __toInt(l.get(k)); return r; }
  static long[] __toLongArr(Object v) { List<Object> l = __list(v); long[] r = new long[l.size()]; for (int k = 0; k < r.length; k++) r[k] = __toLong(l.get(k)); return r; }
  static double[] __toDoubleArr(Object v) { List<Object> l = __list(v); double[] r = new double[l.size()]; for (int k = 0; k < r.length; k++) r[k] = __toDouble(l.get(k)); return r; }
  static boolean[] __toBoolArr(Object v) { List<Object> l = __list(v); boolean[] r = new boolean[l.size()]; for (int k = 0; k < r.length; k++) r[k] = __toBool(l.get(k)); return r; }
  static String[] __toStrArr(Object v) { List<Object> l = __list(v); String[] r = new String[l.size()]; for (int k = 0; k < r.length; k++) r[k] = __toStr(l.get(k)); return r; }
  static int[][] __toIntMatrix(Object v) { List<Object> l = __list(v); int[][] r = new int[l.size()][]; for (int k = 0; k < r.length; k++) r[k] = __toIntArr(l.get(k)); return r; }

  static String __escape(String s) {
    StringBuilder out = new StringBuilder("\"");
    for (int k = 0; k < s.length(); k++) {
      char c = s.charAt(k);
      switch (c) {
        case '"': out.append("\\\""); break;
        case '\\': out.append("\\\\"); break;
        case '\n': out.append("\\n"); break;
        case '\t': out.append("\\t"); break;
        case '\r': out.append("\\r"); break;
        case '\b': out.append("\\b"); break;
        case '\f': out.append("\\f"); break;
        default:
          if (c < 0x20) out.append(String.format("\\u%04x", (int) c));
          else out.append(c);
      }
    }
    return out.append('"').toString();
  }

  static String __num(double d) {
    if (d == Math.rint(d) && Math.abs(d) < 1e15) return Long.toString((long) d);
    return Double.toString(d);
  }

  static String __ser(Object v) {
    if (v == null) return "null";
    if (v instanceof String) return __escape((String) v);
    if (v instanceof Boolean) return v.toString();
    if (v instanceof Double || v instanceof Float) return __num(((Number) v).doubleValue());
    if (v instanceof Number) return v.toString();
    if (v instanceof Character) return __escape(v.toString());
    if (v instanceof Collection<?>) {
      StringJoiner joiner = new StringJoiner(",", "[", "]");
      for (Object item : (Collection<?>) v) joiner.add(__ser(item));
      return joiner.toString();
    }
    if (v.getClass().isArray()) {
      StringJoiner joiner = new StringJoiner(",", "[", "]");
      int length = java.lang.reflect.Array.getLength(v);
      for (int k = 0; k < length; k++) joiner.add(__ser(java.lang.reflect.Array.get(v, k)));
      return joiner.toString();
    }
    return __escape(v.toString());
  }

  static long __peakMemoryKb() {
    try (BufferedReader reader = new BufferedReader(new FileReader("/proc/self/status"))) {
      String line;
      while ((line = reader.readLine()) != null) {
        if (line.startsWith("VmHWM:")) {
          return Long.parseLong(line.replaceAll("[^0-9]", ""));
        }
      }
    } catch (IOException ignored) {
      return 0;
    }
    return 0;
  }

  static String __errorMessage(Throwable e) {
    String message = e.getMessage();
    return message == null ? e.getClass().getSimpleName() : e.getClass().getSimpleName() + ": " + message;
  }

  __ELEVATE_INVOKE__

  public static void main(String[] args) throws Exception {
    String content = new String(Files.readAllBytes(Paths.get("/sandbox/cases.json")), StandardCharsets.UTF_8);
    List<Object> cases = __list(new ElevateJson(content).parse());
    PrintStream stdout = System.out;
    for (Object rawCase : cases) {
      @SuppressWarnings("unchecked")
      Map<String, Object> testCase = (Map<String, Object>) rawCase;
      String id = String.valueOf(testCase.get("id"));
      String input = String.valueOf(testCase.get("input"));
      long start = System.nanoTime();
      String line;
      try {
        List<Object> callArgs = __list(new ElevateJson("[" + input + "]").parse());
        String out = __elevateInvoke(callArgs);
        double ms = (System.nanoTime() - start) / 1_000_000.0;
        line = "{\"caseId\":" + __escape(id) + ",\"status\":\"ok\",\"output\":" + __escape(out)
            + ",\"runtimeMs\":" + ms + ",\"peakMemoryKb\":" + __peakMemoryKb() + "}";
      } catch (Throwable e) {
        double ms = (System.nanoTime() - start) / 1_000_000.0;
        line = "{\"caseId\":" + __escape(id) + ",\"status\":\"error\",\"error\":" + __escape(__errorMessage(e))
            + ",\"runtimeMs\":" + ms + ",\"peakMemoryKb\":" + __peakMemoryKb() + "}";
      }
      stdout.println("${JAVA_RESULT_SENTINEL}" + line);
      stdout.flush();
    }
  }
}
`;
