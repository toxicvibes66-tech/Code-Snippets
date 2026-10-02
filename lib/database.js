const fs = require('node:fs');
const path = require('node:path');
const { CURATED_TEMPLATES } = require('./catalog');

function createDatabase(filePath) {
  const directory = path.dirname(filePath);

  function write(state) {
    fs.mkdirSync(directory, { recursive: true });
    const temporaryPath = `${filePath}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(temporaryPath, filePath);
    return state;
  }

  function initialize() {
    fs.mkdirSync(directory, { recursive: true });
    let state;

    if (fs.existsSync(filePath)) {
      try {
        state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        throw new Error(`The database file at ${filePath} contains invalid JSON. Back it up, then repair or remove it.`);
      }
    } else {
      state = {};
    }

    state.users = Array.isArray(state.users) ? state.users : [];
    state.sessions = Array.isArray(state.sessions) ? state.sessions : [];
    state.templates = Array.isArray(state.templates) ? state.templates : [];
    state.reviews = Array.isArray(state.reviews) ? state.reviews : [];
    state.follows = Array.isArray(state.follows) ? state.follows : [];
    state.notifications = Array.isArray(state.notifications) ? state.notifications : [];

    const templateIds = new Set(state.templates.map((template) => template.id));
    CURATED_TEMPLATES.forEach((template) => {
      if (!templateIds.has(template.id)) {
        state.templates.push({
          ...template,
          author: 'Snippet Studio',
          authorId: null,
          createdAt: '2026-01-01T00:00:00.000Z'
        });
      }
    });

    write(state);
  }

  function read() {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  initialize();

  return { read, write, filePath };
}

module.exports = { createDatabase };
