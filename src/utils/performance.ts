/**
 * Startup Performance Benchmarks
 *
 * This file contains utilities to measure and track extension startup time
 *
 * Performance Goals:
 * - Extension activation: <10ms
 * - Command registration: <5ms
 * - First command execution: <50ms
 */

import { performance } from 'perf_hooks';

interface PerformanceMetrics {
    activationStart?: number;
    activationEnd?: number;
    activationDuration?: number;
    commandRegistrationDuration?: number;
    configLoadDuration?: number;
}

const metrics: PerformanceMetrics = {};

/**
 * Start timing extension activation
 */
export function startActivationTiming(): void {
    metrics.activationStart = performance.now();
}

/**
 * End timing extension activation and log results
 */
export function endActivationTiming(): void {
    if (!metrics.activationStart) {
        return;
    }

    metrics.activationEnd = performance.now();
    metrics.activationDuration = metrics.activationEnd - metrics.activationStart;

    logMetrics();
}

/**
 * Time config loading
 */
export function timeConfigLoad(duration: number): void {
    metrics.configLoadDuration = duration;
}

/**
 * Time command registration
 */
export function timeCommandRegistration(duration: number): void {
    metrics.commandRegistrationDuration = duration;
}

/**
 * Log performance metrics
 */
function logMetrics(): void {
    if (process.env.NODE_ENV === 'production') {
        return;
    }

    /* eslint-disable no-console */
    console.log('--- Performance Metrics ---');

    if (metrics.activationDuration !== undefined) {
        const score = getPerformanceScore(metrics.activationDuration, 'activation');
        console.log(`Extension Activation: ${metrics.activationDuration.toFixed(2)}ms ${score}`);
    }

    if (metrics.configLoadDuration !== undefined) {
        const score = getPerformanceScore(metrics.configLoadDuration, 'config');
        console.log(`Config Load: ${metrics.configLoadDuration.toFixed(2)}ms ${score}`);
    }

    if (metrics.commandRegistrationDuration !== undefined) {
        const score = getPerformanceScore(metrics.commandRegistrationDuration, 'command');
        console.log(
            `Command Registration: ${metrics.commandRegistrationDuration.toFixed(2)}ms ${score}`,
        );
    }

    console.log('-------------------------');
    /* eslint-enable no-console */
}

/**
 * Get performance score based on duration
 */
function getPerformanceScore(duration: number, operation: string): string {
    const thresholds = {
        activation: { excellent: 10, good: 20, fair: 50, poor: 100 },
        command: { excellent: 5, good: 10, fair: 20, poor: 50 },
        config: { excellent: 5, good: 10, fair: 20, poor: 50 },
    };

    const threshold = thresholds[operation as keyof typeof thresholds];

    if (duration <= threshold.excellent) {
        return '🟢 Excellent';
    } else if (duration <= threshold.good) {
        return '🟡 Good';
    } else if (duration <= threshold.fair) {
        return '🟠 Fair';
    } else if (duration <= threshold.poor) {
        return '🔴 Needs Improvement';
    } else {
        return '🔴 Poor - Consider Optimization';
    }
}

/**
 * Check if performance meets goals
 */
export function checkPerformanceGoals(): {
    activation: boolean;
    command: boolean;
    config: boolean;
} {
    const goals = {
        activation: 10,
        command: 5,
        config: 5,
    };

    return {
        activation: (metrics.activationDuration || 0) <= goals.activation,
        command: (metrics.commandRegistrationDuration || 0) <= goals.command,
        config: (metrics.configLoadDuration || 0) <= goals.config,
    };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics(): void {
    for (const key in metrics) {
        delete metrics[key as keyof PerformanceMetrics];
    }
}
