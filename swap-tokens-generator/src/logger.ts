import { inspect } from "node:util";

const COLOR = true;

function ymdhms() {
  const d = new Date();
  return (
    d.getFullYear().toString().padStart(4, "0") +
    ":" +
    (d.getMonth() + 1).toString().padStart(2, "0") +
    ":" +
    d.getDate().toString().padStart(2, "0") +
    " " +
    d.getHours().toString().padStart(2, "0") +
    ":" +
    d.getMinutes().toString().padStart(2, "0") +
    ":" +
    d.getSeconds().toString().padStart(2, "0") +
    "." +
    d.getMilliseconds().toString().padStart(3, "0")
  );
}

export const LogLevel = {
  SILENT: 0,
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

function levelToNumber(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case "silent":
      return LogLevel.SILENT;
    case "trace":
      return LogLevel.TRACE;
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default: {
      console.warn(`Unknown log level: ${level}`);
      return LogLevel.SILENT;
    }
  }
}

export class Logger {
  name: string;
  levelNumber: LogLevel;
  color: boolean;
  stderr: (string: string) => void;
  stdout: (string: string) => void;

  constructor(
    options?: Readonly<{
      color?: boolean;
      name?: string;
      level?: string | LogLevel;
      stdout?: (string: string) => void;
      stderr?: (string: string) => void;
    }>,
  ) {
    this.color = options?.color ?? COLOR;
    this.name = options?.name ?? "";
    const level = options?.level;
    if (level != null) {
      if (typeof level === "number") this.levelNumber = level;
      else this.levelNumber = levelToNumber(level);
    } else {
      this.levelNumber = LogLevel.INFO;
    }
    this.stdout = options?.stdout ?? console.info.bind(console);
    this.stderr = options?.stderr ?? console.error.bind(console);
  }

  setLevel(level: string) {
    this.levelNumber = levelToNumber(level);
  }

  #args(args: any[]): string {
    let msg = "";
    for (let i = 0, len = args.length; i < len; i++) {
      if (i % 2 == 0) msg += `  \x1b[32m${String(args[i])}\x1b[0m`;
      else msg += `=${String(args[i])}`;
    }
    return msg;
  }

  #header(levelNumber: LogLevel, extraContext: null | string): string {
    let timestampStr = ymdhms();
    if (this.color) timestampStr = `\x1b[90m${timestampStr}\x1b[0m`;

    let levelStr: string;
    switch (levelNumber) {
      case LogLevel.SILENT:
        levelStr = "SILENT";
        if (this.color) levelStr = `\x1b[90m${levelStr}\x1b[0m`;
        break;
      case LogLevel.TRACE:
        levelStr = "TRACE";
        if (this.color) levelStr = `\x1b[90m${levelStr}\x1b[0m`;
        break;
      case LogLevel.DEBUG:
        levelStr = "DEBUG";
        if (this.color) levelStr = `\x1b[36m${levelStr}\x1b[0m`;
        break;
      case LogLevel.INFO:
        levelStr = "INFO";
        if (this.color) levelStr = `\x1b[32m${levelStr}\x1b[0m`;
        break;
      case LogLevel.WARN:
        levelStr = "WARN";
        if (this.color) levelStr = `\x1b[33m${levelStr}\x1b[0m`;
        break;
      case LogLevel.ERROR:
        levelStr = "ERROR";
        if (this.color) levelStr = `\x1b[31m${levelStr}\x1b[0m`;
        break;
      default:
        levelNumber satisfies never;
        levelStr = "UNKNOWN";
        if (this.color) levelStr = `\x1b[35m${levelStr}\x1b[0m`;
    }

    let msgHeader = `${timestampStr}`;

    let contextStr = "";
    if (this.name) {
      let nameStr = this.name;
      if (this.color && nameStr) nameStr = `\x1b[90m${nameStr}\x1b[0m`;
      contextStr += nameStr;
    }
    if (extraContext) {
      let extraContextStr = extraContext;
      if (this.color) extraContextStr = `\x1b[90m${extraContextStr}\x1b[0m`;
      contextStr += `::${extraContextStr}`;
    }
    if (contextStr) {
      msgHeader += ` [${contextStr}]`;
    }

    msgHeader += ` ${levelStr}: `;

    return msgHeader;
  }

  /** Drop a SILENT level message */
  silent(_message: string): void {
    return;
  }
  /** Log a TRACE level message */
  trace(message: string): void {
    if (this.levelNumber > LogLevel.TRACE) return;
    const msg = `${this.#header(LogLevel.TRACE, null)}${message}`;
    this.stdout(msg);
  }
  /** Log a DEBUG level message */
  debug(message: string): void {
    if (this.levelNumber > LogLevel.DEBUG) return;
    const msg = `${this.#header(LogLevel.DEBUG, null)}${message}`;
    this.stdout(msg);
  }
  /** Log an INFO level message */
  info(message: string): void {
    if (this.levelNumber > LogLevel.INFO) return;
    const msg = `${this.#header(LogLevel.INFO, null)}${message}`;
    this.stdout(msg);
  }
  /** Log a WARN level message */
  warn(message: string): void {
    if (this.levelNumber > LogLevel.WARN) return;
    const msg = `${this.#header(LogLevel.WARN, null)}${message}`;
    this.stdout(msg);
  }
  /** Log an ERROR level message */
  error(message: string): void {
    if (this.levelNumber > LogLevel.ERROR) return;
    const msg = `${this.#header(LogLevel.ERROR, null)}${message}`;
    this.stdout(msg);
  }

  /** Drop a SILENT level message */
  ssilent(_message: string, ..._args: any): void {
    return;
  }
  /** Log a TRACE level message with structured key-value pairs */
  strace(message: string, ...args: any): void {
    if (this.levelNumber > LogLevel.TRACE) return;
    const msg = `${this.#header(LogLevel.TRACE, null)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log a DEBUG level message with structured key-value pairs */
  sdebug(message: string, ...args: any): void {
    if (this.levelNumber > LogLevel.DEBUG) return;
    const msg = `${this.#header(LogLevel.DEBUG, null)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log an INFO level message with structured key-value pairs */
  sinfo(message: string, ...args: any): void {
    if (this.levelNumber > LogLevel.INFO) return;
    const msg = `${this.#header(LogLevel.INFO, null)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log a WARN level message with structured key-value pairs */
  swarn(message: string, ...args: any) {
    if (this.levelNumber > LogLevel.WARN) return;
    const msg = `${this.#header(LogLevel.WARN, null)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log an ERROR level message with structured key-value pairs */
  serror(message: string, ...args: any) {
    if (this.levelNumber > LogLevel.ERROR) return;
    const msg = `${this.#header(LogLevel.ERROR, null)}${message}${this.#args(args)}`;
    this.stderr(msg);
  }

  /** Drop a SILENT level message */
  osilent(_message: string, ..._args: any): void {
    return;
  }
  /** Log a TRACE level message inspecting all extra arguments */
  otrace(message: string, ...args: any[]): void {
    if (this.levelNumber > LogLevel.TRACE) return;
    let msg = `${this.#header(LogLevel.TRACE, null)}${message}`;
    if (args.length)
      msg +=
        "  " +
        args
          .map((arg) => inspect(arg, { colors: this.color, depth: 8 }))
          .join(", ");
    this.stdout(msg);
  }
  /** Log a DEBUG level message inspecting all extra arguments */
  odebug(message: string, ...args: any[]): void {
    if (this.levelNumber > LogLevel.DEBUG) return;
    let msg = `${this.#header(LogLevel.DEBUG, null)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stdout(msg);
  }
  /** Log an INFO level message inspecting all extra arguments */
  oinfo(message: string, ...args: any[]): void {
    if (this.levelNumber > LogLevel.INFO) return;
    let msg = `${this.#header(LogLevel.INFO, null)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stdout(msg);
  }
  /** Log a WARN level message inspecting all extra arguments */
  owarn(message: string, ...args: any[]) {
    if (this.levelNumber > LogLevel.WARN) return;
    let msg = `${this.#header(LogLevel.WARN, null)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stdout(msg);
  }
  /** Log an ERROR level message inspecting all extra arguments */
  oerror(message: string, ...args: any[]) {
    if (this.levelNumber > LogLevel.ERROR) return;
    let msg = `${this.#header(LogLevel.ERROR, null)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stderr(msg);
  }

  /** Drop a SILENT level message */
  csilent(_context: string, _message: string): void {
    return;
  }
  /** Log a TRACE level message with the given context */
  ctrace(context: string, message: string): void {
    if (this.levelNumber > LogLevel.TRACE) return;
    const msg = `${this.#header(LogLevel.TRACE, context)}${message}`;
    this.stdout(msg);
  }
  /** Log a DEBUG level message with the given context */
  cdebug(context: string, message: string): void {
    if (this.levelNumber > LogLevel.DEBUG) return;
    const msg = `${this.#header(LogLevel.DEBUG, context)}${message}`;
    this.stdout(msg);
  }
  /** Log an INFO level message with the given context */
  cinfo(context: string, message: string): void {
    if (this.levelNumber > LogLevel.INFO) return;
    const msg = `${this.#header(LogLevel.INFO, context)}${message}`;
    this.stdout(msg);
  }
  /** Log a WARN level message with the given context */
  cwarn(context: string, message: string): void {
    if (this.levelNumber > LogLevel.WARN) return;
    const msg = `${this.#header(LogLevel.WARN, context)}${message}`;
    this.stdout(msg);
  }
  /** Log an ERROR level message with the given context */
  cerror(context: string, message: string): void {
    if (this.levelNumber > LogLevel.ERROR) return;
    const msg = `${this.#header(LogLevel.ERROR, context)}${message}`;
    this.stderr(msg);
  }

  /** Drop a SILENT level message */
  cssilent(_context: string, _message: string, ..._args: any): void {
    return;
  }
  /** Log a TRACE level message with the given context and structured key-value pairs */
  cstrace(context: string, message: string, ...args: any): void {
    if (this.levelNumber > LogLevel.TRACE) return;
    const msg = `${this.#header(LogLevel.TRACE, context)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log a DEBUG level message with the given context and structured key-value pairs */
  csdebug(context: string, message: string, ...args: any): void {
    if (this.levelNumber > LogLevel.DEBUG) return;
    const msg = `${this.#header(LogLevel.DEBUG, context)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log an INFO level message with the given context and structured key-value pairs */
  csinfo(context: string, message: string, ...args: any): void {
    if (this.levelNumber > LogLevel.INFO) return;
    const msg = `${this.#header(LogLevel.INFO, context)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log a WARN level message with the given context and structured key-value pairs */
  cswarn(context: string, message: string, ...args: any) {
    if (this.levelNumber > LogLevel.WARN) return;
    const msg = `${this.#header(LogLevel.WARN, context)}${message}${this.#args(args)}`;
    this.stdout(msg);
  }
  /** Log an ERROR level message with the given context and structured key-value pairs */
  cserror(context: string, message: string, ...args: any) {
    if (this.levelNumber > LogLevel.ERROR) return;
    const msg = `${this.#header(LogLevel.ERROR, context)}${message}${this.#args(args)}`;
    this.stderr(msg);
  }

  /** Drop a SILENT level message */
  cosilent(_context: string, _message: string, ..._args: any): void {
    return;
  }
  /** Log a TRACE level message with the given context inspecting all extra arguments */
  cotrace(context: string, message: string, ...args: any[]): void {
    if (this.levelNumber > LogLevel.TRACE) return;
    let msg = `${this.#header(LogLevel.TRACE, context)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stdout(msg);
  }
  /** Log a DEBUG level message with the given context inspecting all extra arguments */
  codebug(context: string, message: string, ...args: any[]): void {
    if (this.levelNumber > LogLevel.DEBUG) return;
    let msg = `${this.#header(LogLevel.DEBUG, context)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stdout(msg);
  }
  /** Log an INFO level message with the given context inspecting all extra arguments */
  coinfo(context: string, message: string, ...args: any[]): void {
    if (this.levelNumber > LogLevel.INFO) return;
    let msg = `${this.#header(LogLevel.INFO, context)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stdout(msg);
  }
  /** Log a WARN level message with the given context inspecting all extra arguments */
  cowarn(context: string, message: string, ...args: any[]) {
    if (this.levelNumber > LogLevel.WARN) return;
    let msg = `${this.#header(LogLevel.WARN, context)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stdout(msg);
  }
  /** Log an ERROR level message with the given context inspecting all extra arguments */
  coerror(context: string, message: string, ...args: any[]) {
    if (this.levelNumber > LogLevel.ERROR) return;
    let msg = `${this.#header(LogLevel.ERROR, context)}${message}`;
    if (args.length) msg += "  " + args .map((arg) => inspect(arg, { colors: this.color, depth: 8 })) .join(", ");
    this.stderr(msg);
  }
}
