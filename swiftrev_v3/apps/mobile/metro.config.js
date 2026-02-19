const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace ROOTS
const projectRoot = __dirname;
// Since apps/mobile is at the same level as packages/core
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve queries from the local node_modules instead of workspace node_modules
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
