// port-utils.js
// ==========================================
// Utility functions for managing communication between scripts via ports in Bitburner.

// Ports 1–19 are designated for input.
// Port 20 is used for output (typically for returning results or responses).

export const minInputPort = 1;
export const maxInputPort = 19;
export const outputPort = 20;

// Utility function to determine if a port is in the input range.
function isInputPort(port) {
	return minInputPort <= port && port <= maxInputPort;
}

/**
 * Push a message to an input port.
 * Used to send structured events (requests) to other scripts.
 *
 * @param {NS} ns - Netscript namespace.
 * @param {string} eventType - Type of event or command.
 * @param {string} reqId - Unique request ID (for tracking responses).
 * @param {any} data - Payload to send (will be JSON stringified).
 * @param {number} port - The target input port (1–19).
 */
export function pushToInputPort(ns, eventType, reqId, data, port) {
	if (!isInputPort(port)) {
		ns.tprint(`ERROR\t Input ports must be between ${minInputPort} and ${maxInputPort}!`);
		return;
	}
	const handle = ns.getPortHandle(port);
	const payload = {
		eventType,
		reqId, // Unique identifier for request tracking
		data: JSON.stringify(data) // Convert data to string for transmission
	};
	handle.write(JSON.stringify(payload));
}

/**
 * Push a message to the output port (port 20).
 * Typically used to return results or responses to a requesting script.
 *
 * @param {NS} ns - Netscript namespace.
 * @param {string} payload - Already-stringified message to be sent.
 * @returns {boolean} - Returns false if the port is full, true otherwise.
 */
export function pushToOutputPort(ns, payload) {
	const handle = ns.getPortHandle(outputPort);
	if (handle.full()) {
		return false;
	}
	handle.write(payload);
	return true;
}

/**
 * Check the output port (port 20) for a specific event type (and optionally request ID).
 * Used to pull structured responses from scripts.
 *
 * @param {NS} ns - Netscript namespace.
 * @param {string} eventType - Event type to listen for.
 * @param {string} [reqId="ANY"] - Optional specific request ID to match.
 * @returns {object|undefined} - Parsed payload if match found, otherwise undefined.
 */
export function checkForEvent(ns, eventType, reqId = "ANY") {
	const handle = ns.getPortHandle(outputPort);
	if (!handle.empty()) {
		const payload = JSON.parse(handle.peek()); // Look at the data without removing it
		if (payload.eventType === eventType) {
			if (reqId !== "ANY" && reqId !== payload.reqId) {
				// Request ID doesn't match, ignore
				return undefined;
			}
			handle.read(); // Match found — remove from queue
			return {
				data: JSON.parse(payload.data), // Re-parse original object
				reqId: payload.reqId
			};
		}
	}
	return undefined; // No matching event
}

/**
 * Generate a UUID (Universally Unique Identifier).
 * Used for assigning unique request IDs.
 * 
 * Based on a commonly used UUID v4 generation pattern in JavaScript.
 * Reference: https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
 *
 * @returns {string} - A random UUID string.
 */
export function createUUID() {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
}
