const fs = require('node:fs');
const path = require('node:path');

const IS_VALID_NUMBER_REGEX = /^\d{2,}$/;

function readFragments(filePath) {
    const content = fs.readFileSync(filePath, 'utf8').trim();

    if (!content) {
        throw new Error('The input file contains no fragments');
    }

    return content.split(/\s+/);
}

function validateFragments(fragments) {
    for (const fragment of fragments) {
        if (!IS_VALID_NUMBER_REGEX.test(fragment)) {
            throw new Error(`Invalid fragment: ${fragment}`);
        }
    }
}

function getPrefixIndex(fragments) {
    const index = new Map();

    for (let i = 0; i < fragments.length; i++) {
        const prefix = fragments[i].slice(0, 2);

        if (!index.has(prefix)) {
            index.set(prefix, []);
        }

        index.get(prefix).push(i);
    }

    return index;
}

function findLongestChain(fragments, prefixIndex) {
    const used = fragments.map(() => false);

    let currentPath = [];
    let bestPath = [];

    function countReachableUnusedEdges(startVertex) {
        const visitedVertices = new Set([startVertex]);
        const queue = [startVertex];
        let count = 0;

        for (let head = 0; head < queue.length; head++) {
            const vertex = queue[head];
            const candidates = prefixIndex.get(vertex) ?? [];

            for (const i of candidates) {
                if (used[i]) continue;

                count++;

                const nextVertex = fragments[i].slice(-2);

                if (!visitedVertices.has(nextVertex)) {
                    visitedVertices.add(nextVertex);
                    queue.push(nextVertex);
                }
            }
        }

        return count;
    }

    function searchLongestChainDFS() {
        if (currentPath.length > bestPath.length) {
            bestPath = [...currentPath];
        }

        const current = fragments[currentPath[currentPath.length - 1]];
        const suffix = current.slice(-2);

        const reachable = countReachableUnusedEdges(suffix);

        if (currentPath.length + reachable <= bestPath.length) {
            return;
        }

        const candidates = prefixIndex.get(suffix) ?? [];

        for (const i of candidates) {
            if (used[i]) continue;

            used[i] = true;
            currentPath.push(i);

            searchLongestChainDFS();

            currentPath.pop();
            used[i] = false;
        }
    }

    for (let i = 0; i < fragments.length; i++) {
        currentPath = [i];
        used.fill(false);
        used[i] = true;

        searchLongestChainDFS();
    }

    return bestPath;
}

function validateChain(result, fragments) {
    const uniqueIndexes = new Set(result);

    const validIndexes = result.every(
        (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < fragments.length,
    );

    if (!validIndexes || uniqueIndexes.size !== result.length) {
        throw new Error('The resulting chain failed validation');
    }

    const validTransitions = result.every((index, i) => {
        if (i === 0) return true;

        const previousFragment = fragments[result[i - 1]];
        const currentFragment = fragments[index];

        return previousFragment.slice(-2) === currentFragment.slice(0, 2);
    });

    if (!validTransitions) {
        throw new Error('The resulting chain failed validation');
    }
}

function getAnswer(chain) {
    if (chain.length === 0) {
        return '';
    }

    return (
        chain[0] +
        chain
            .slice(1)
            .map((fragment) => fragment.slice(2))
            .join('')
    );
}

function logResults(chain, answer) {
    console.log('Validation passed');
    console.log('Chain length:', chain.length);
    console.log('Chain:', chain);
    console.log('Final string length:', answer.length);
    console.log('Final string:', answer);
}

function main() {
    const file = process.argv[2] ?? path.join(__dirname, 'source.txt');
    const fragments = readFragments(file);

    validateFragments(fragments);

    const prefixIndex = getPrefixIndex(fragments);

    const result = findLongestChain(fragments, prefixIndex);

    validateChain(result, fragments);

    const chain = result.map((index) => fragments[index]);
    const answer = getAnswer(chain);

    logResults(chain, answer);
}

main();
