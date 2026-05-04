let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  return ioInstance;
}

function projectRoom(projectId) {
  return `project:${projectId}`;
}

function emitToProject(projectId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(projectRoom(projectId)).emit(event, payload);
}

module.exports = {
  setIO,
  getIO,
  projectRoom,
  emitToProject
};

