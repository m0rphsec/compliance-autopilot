/**
 * Unit tests for logger utility
 * Tests structured logging for GitHub Actions via @actions/core
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import * as core from "@actions/core";
import { Logger, LogLevel, createLogger } from "../../../src/utils/logger";

// Mock @actions/core
jest.mock("@actions/core", () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  startGroup: jest.fn(),
  endGroup: jest.fn(),
}));

const mockedCore = core as jest.Mocked<typeof core>;

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Construction", () => {
    it("should create a logger with default config", () => {
      const logger = new Logger();
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should create a logger with custom log level", () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug("debug message");
      expect(mockedCore.debug).toHaveBeenCalledWith("debug message");
    });

    it("should create a logger with default metadata", () => {
      const logger = new Logger({
        defaultMetadata: { component: "scanner" },
      });
      logger.info("test");
      expect(mockedCore.info).toHaveBeenCalledWith(
        expect.stringContaining("scanner")
      );
    });
  });

  describe("Log Levels", () => {
    it("should log info messages via core.info", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.info("hello");
      expect(mockedCore.info).toHaveBeenCalledWith("hello");
    });

    it("should log error messages via core.error", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.error("bad thing");
      expect(mockedCore.error).toHaveBeenCalledWith("bad thing");
    });

    it("should log warn messages via core.warning", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.warn("watch out");
      expect(mockedCore.warning).toHaveBeenCalledWith("watch out");
    });

    it("should log debug messages via core.debug", () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug("details");
      expect(mockedCore.debug).toHaveBeenCalledWith("details");
    });
  });

  describe("Log Level Filtering", () => {
    it("should suppress debug when level is INFO", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.debug("hidden");
      expect(mockedCore.debug).not.toHaveBeenCalled();
    });

    it("should suppress debug and info when level is WARN", () => {
      const logger = new Logger({ level: LogLevel.WARN });
      logger.debug("hidden");
      logger.info("hidden");
      expect(mockedCore.debug).not.toHaveBeenCalled();
      expect(mockedCore.info).not.toHaveBeenCalled();
    });

    it("should only allow error when level is ERROR", () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      logger.debug("hidden");
      logger.info("hidden");
      logger.warn("hidden");
      logger.error("visible");
      expect(mockedCore.debug).not.toHaveBeenCalled();
      expect(mockedCore.info).not.toHaveBeenCalled();
      expect(mockedCore.warning).not.toHaveBeenCalled();
      expect(mockedCore.error).toHaveBeenCalledWith("visible");
    });

    it("should allow all levels when level is DEBUG", () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug("d");
      logger.info("i");
      logger.warn("w");
      logger.error("e");
      expect(mockedCore.debug).toHaveBeenCalled();
      expect(mockedCore.info).toHaveBeenCalled();
      expect(mockedCore.warning).toHaveBeenCalled();
      expect(mockedCore.error).toHaveBeenCalled();
    });
  });

  describe("Metadata formatting", () => {
    it("should append metadata as JSON when provided", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.info("test", { component: "scanner", operation: "scan" });
      const callArg = (mockedCore.info as jest.Mock).mock.calls[0][0] as string;
      expect(callArg).toContain("scanner");
      expect(callArg).toContain("scan");
    });

    it("should output plain message when no metadata", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.info("plain message");
      expect(mockedCore.info).toHaveBeenCalledWith("plain message");
    });

    it("should merge default metadata with call metadata", () => {
      const logger = new Logger({
        level: LogLevel.INFO,
        defaultMetadata: { component: "api" },
      });
      logger.info("test", { operation: "fetch" });
      const callArg = (mockedCore.info as jest.Mock).mock.calls[0][0] as string;
      expect(callArg).toContain("api");
      expect(callArg).toContain("fetch");
    });
  });

  describe("Error logging with Error object", () => {
    it("should include error details in metadata", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      const err = new Error("boom");
      logger.error("operation failed", err);
      const callArg = (mockedCore.error as jest.Mock).mock.calls[0][0] as string;
      expect(callArg).toContain("operation failed");
      expect(callArg).toContain("boom");
    });

    it("should work without an Error object", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.error("simple error");
      expect(mockedCore.error).toHaveBeenCalledWith("simple error");
    });
  });

  describe("Child logger", () => {
    it("should create child with merged metadata", () => {
      const parent = new Logger({
        level: LogLevel.INFO,
        defaultMetadata: { component: "parent" },
      });
      const child = parent.child({ operation: "child-op" });
      child.info("from child");
      const callArg = (mockedCore.info as jest.Mock).mock.calls[0][0] as string;
      expect(callArg).toContain("parent");
      expect(callArg).toContain("child-op");
    });
  });

  describe("Log Groups", () => {
    it("should call core.startGroup", () => {
      const logger = new Logger();
      logger.startGroup("My Group");
      expect(mockedCore.startGroup).toHaveBeenCalledWith("My Group");
    });

    it("should call core.endGroup", () => {
      const logger = new Logger();
      logger.endGroup();
      expect(mockedCore.endGroup).toHaveBeenCalled();
    });
  });

  describe("Timing", () => {
    it("should log timing information", () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.timing("fetchData", 1234);
      const callArg = (mockedCore.info as jest.Mock).mock.calls[0][0] as string;
      expect(callArg).toContain("Operation completed: fetchData");
      expect(callArg).toContain("1234");
    });
  });

  describe("Measure", () => {
    it("should measure async operation and log timing", async () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      const result = await logger.measure("testOp", async () => {
        return 42;
      });
      expect(result).toBe(42);
      expect(mockedCore.debug).toHaveBeenCalledWith(
        expect.stringContaining("Starting operation: testOp")
      );
      expect(mockedCore.info).toHaveBeenCalledWith(
        expect.stringContaining("Operation completed: testOp")
      );
    });

    it("should log error and rethrow on failure", async () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      await expect(
        logger.measure("failOp", async () => {
          throw new Error("boom");
        })
      ).rejects.toThrow("boom");
      expect(mockedCore.error).toHaveBeenCalledWith(
        expect.stringContaining("Operation failed: failOp")
      );
    });
  });

  describe("createLogger helper", () => {
    it("should create a logger with component metadata", () => {
      const log = createLogger("evidence-collector");
      log.info("collecting");
      const callArg = (mockedCore.info as jest.Mock).mock.calls[0][0] as string;
      expect(callArg).toContain("evidence-collector");
    });
  });

  describe("LogLevel enum", () => {
    it("should have the expected values", () => {
      expect(LogLevel.DEBUG).toBe("debug");
      expect(LogLevel.INFO).toBe("info");
      expect(LogLevel.WARN).toBe("warn");
      expect(LogLevel.ERROR).toBe("error");
    });
  });
});
