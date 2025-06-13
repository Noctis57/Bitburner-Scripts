// utils.js
// ==========================================
// General-purpose helper functions for scanning, penetration, resource checks, and server analysis.

var homeServer = "home"; // Common alias for where hacking/crack tools are stored

/**
 * Performs a full network scan starting from the current host.
 * Uses DFS (depth-first search) to explore all reachable nodes.
 *
 * @param {NS} ns - Netscript namespace
 * @returns {string[]} - Array of all discovered server hostnames
 */
export function getNetworkNodes(ns) {
	var visited = {};
	var stack = [];
	var origin = ns.getHostname(); // Start from the current server
	stack.push(origin);

	while (stack.length > 0) {
		var node = stack.pop();
		if (!visited[node]) {
			visited[node] = node;
			var neighbours = ns.scan(node); // Get connected nodes
			for (var i = 0; i < neighbours.length; i++) {
				var child = neighbours[i];
				if (!visited[child]) {
					stack.push(child);
				}
			}
		}
	}
	return Object.keys(visited);
}

/**
 * Attempts to run cracking tools (e.g., BruteSSH.exe) on a server.
 *
 * @param {NS} ns - Netscript namespace
 * @param {string} server - Target server to crack
 * @param {Object} cracks - A map of filenames to cracking functions
 */
export function penetrate(ns, server, cracks) {
	ns.print("Penetrating " + server);
	for (var file of Object.keys(cracks)) {
		if (ns.fileExists(file, homeServer)) {
			var runScript = cracks[file]; // Crack function
			runScript(server); // Execute against server
		}
	}
}

/**
 * Counts how many cracking tools you currently have access to.
 *
 * @param {NS} ns
 * @param {Object} cracks - Map of crack file names to functions
 * @returns {number} - Count of usable crack tools
 */
function getNumCracks(ns, cracks) {
	return Object.keys(cracks).filter(function (file) {
		return ns.fileExists(file, homeServer);
	}).length;
}

/**
 * Checks if you have enough cracking tools to gain access to a given server.
 *
 * @param {NS} ns
 * @param {string} server
 * @param {Object} cracks
 * @returns {boolean}
 */
export function canPenetrate(ns, server, cracks) {
	var numCracks = getNumCracks(ns, cracks);
	var reqPorts = ns.getServerNumPortsRequired(server);
	return numCracks >= reqPorts;
}

/**
 * Determines if a server has enough available RAM to run a script.
 *
 * @param {NS} ns
 * @param {string} server
 * @param {number} scriptRam - RAM requirement of the script
 * @param {boolean} useMax - If true, use max RAM instead of available
 * @returns {boolean}
 */
export function hasRam(ns, server, scriptRam, useMax = false) {
	var maxRam = ns.getServerMaxRam(server);
	var usedRam = ns.getServerUsedRam(server);
	var ramAvail = useMax ? maxRam : maxRam - usedRam;
	return ramAvail > scriptRam;
}

/**
 * Checks whether the player has the required hacking level for a server.
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {boolean}
 */
export function canHack(ns, server) {
	var pHackLvl = ns.getHackingLevel(); // player level
	var sHackLvl = ns.getServerRequiredHackingLevel(server); // server required level
	return pHackLvl >= sHackLvl;
}

/**
 * Sums the RAM usage of multiple scripts.
 *
 * @param {NS} ns
 * @param {string[]} scripts - Array of script filenames
 * @returns {number} - Total RAM usage
 */
export function getTotalScriptRam(ns, scripts) {
	return scripts.reduce((sum, script) => {
		sum += ns.getScriptRam(script);
		return sum;
	}, 0);
}

/**
 * Attempts to gain root access on a server, using cracking tools if needed.
 *
 * @param {NS} ns
 * @param {string} server
 * @param {Object} cracks
 */
export function getRootAccess(ns, server, cracks) {
	var requiredPorts = ns.getServerNumPortsRequired(server);
	if (requiredPorts > 0) {
		penetrate(ns, server, cracks);
	}
	ns.print("Gaining root access on " + server);
	ns.nuke(server);
}

/**
 * Returns thresholds for hacking:
 * - moneyThresh: 75% of max money (ideal target for hacking)
 * - secThresh: min security level + 5 (acceptable risk for hacks)
 *
 * @param {NS} ns
 * @param {string} node - Server name
 * @returns {{moneyThresh: number, secThresh: number}}
 */
export function getThresholds(ns, node) {
	var moneyThresh = ns.getServerMaxMoney(node) * 0.75;
	var secThresh = ns.getServerMinSecurityLevel(node) + 5;
	return {
		moneyThresh,
		secThresh
	};
}
