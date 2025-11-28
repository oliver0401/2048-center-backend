class CustomLogger {
  log(...args: any) {
    console.log(...args);
  }

  info(...args: any) {
    console.info(...args);
  }

  error(...args: any) {
    console.error(...args);
  }

  group(...args: any) {
    console.group(...args);
  }

  groupEnd() {
    console.groupEnd();
  }

  warn(...args: any) {
    console.warn(...args);
  }

  debug(...args: any) {
    console.debug(...args);
  }

  trace(...args: any) {
    console.trace(...args);
  }
}

export const Logger = new CustomLogger();
