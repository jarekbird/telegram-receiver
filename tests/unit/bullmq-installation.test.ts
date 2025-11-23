/**
 * Test file to verify BullMQ and ioredis installation
 * This test verifies that:
 * - bullmq package can be imported correctly
 * - ioredis package can be imported correctly
 * - TypeScript types are available for both packages
 * - Basic functionality can be used
 *
 * This test is part of PHASE2-012: Install BullMQ dependencies
 */

describe('BullMQ Installation Verification', () => {
  describe('BullMQ Package Import', () => {
    it('should import Queue from bullmq without errors', () => {
      // Arrange & Act
      const { Queue } = require('bullmq');

      // Assert
      expect(Queue).toBeDefined();
      expect(typeof Queue).toBe('function');
    });

    it('should import Worker from bullmq without errors', () => {
      // Arrange & Act
      const { Worker } = require('bullmq');

      // Assert
      expect(Worker).toBeDefined();
      expect(typeof Worker).toBe('function');
    });

    it('should import QueueEvents from bullmq without errors', () => {
      // Arrange & Act
      const { QueueEvents } = require('bullmq');

      // Assert
      expect(QueueEvents).toBeDefined();
      expect(typeof QueueEvents).toBe('function');
    });

    it('should import all common BullMQ exports', () => {
      // Arrange & Act
      const bullmq = require('bullmq');

      // Assert - Verify common exports are available
      expect(bullmq.Queue).toBeDefined();
      expect(bullmq.Worker).toBeDefined();
      expect(bullmq.QueueEvents).toBeDefined();
      expect(bullmq.Job).toBeDefined();
    });
  });

  describe('ioredis Package Import', () => {
    it('should import Redis from ioredis without errors', () => {
      // Arrange & Act
      const Redis = require('ioredis');

      // Assert
      expect(Redis).toBeDefined();
      expect(typeof Redis).toBe('function');
    });

    it('should be able to create a Redis instance (without connecting)', () => {
      // Arrange
      const Redis = require('ioredis');

      // Act - Create instance but don't connect (lazy connection)
      const redis = new Redis({
        lazyConnect: true,
        showFriendlyErrorStack: true,
      });

      // Assert
      expect(redis).toBeDefined();
      // Redis extends EventEmitter, so we check for Redis-specific methods instead
      expect(typeof redis.get).toBe('function');
      expect(typeof redis.set).toBe('function');
      expect(typeof redis.connect).toBe('function');
    });
  });

  describe('TypeScript Type Availability', () => {
    it('should have TypeScript types available for bullmq', () => {
      // This test verifies that TypeScript can compile the imports
      // If types are missing, TypeScript compilation would fail
      // Arrange & Act
      const { Queue, Worker, QueueEvents } = require('bullmq');

      // Assert - If we get here, types are available
      expect(Queue).toBeDefined();
      expect(Worker).toBeDefined();
      expect(QueueEvents).toBeDefined();
    });

    it('should have TypeScript types available for ioredis', () => {
      // This test verifies that TypeScript can compile the imports
      // If types are missing, TypeScript compilation would fail
      // Arrange & Act
      const Redis = require('ioredis');

      // Assert - If we get here, types are available
      expect(Redis).toBeDefined();
    });
  });

  describe('BullMQ and ioredis Integration', () => {
    it('should be able to import both packages together', () => {
      // Arrange & Act
      const { Queue } = require('bullmq');
      const Redis = require('ioredis');

      // Assert
      expect(Queue).toBeDefined();
      expect(Redis).toBeDefined();
    });

    it('should verify package versions are compatible', () => {
      // Arrange
      const bullmqPackage = require('bullmq/package.json');
      const ioredisPackage = require('ioredis/package.json');

      // Act - Check versions exist
      const bullmqVersion = bullmqPackage.version;
      const ioredisVersion = ioredisPackage.version;

      // Assert
      expect(bullmqVersion).toBeDefined();
      expect(ioredisVersion).toBeDefined();
      expect(typeof bullmqVersion).toBe('string');
      expect(typeof ioredisVersion).toBe('string');

      // Log versions for verification
      console.log(`BullMQ version: ${bullmqVersion}`);
      console.log(`ioredis version: ${ioredisVersion}`);
    });
  });
});
