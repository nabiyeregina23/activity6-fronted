// 1. The one localStorage key
const KEY = "maintenance-demo-v2";

// 2. Eight made-up starting records
const startingRecords = [
  { id: 1, title: "Broken classroom light", category: "Electrical", description: "The light in Room B12 does not switch on.", status: "Pending" },
  { id: 2, title: "Leaking tap in toilets", category: "Plumbing", description: "The tap in the ground floor toilets drips all day.", status: "In progress" },
  { id: 3, title: "Broken lecture chair", category: "Furniture", description: "A chair in Lecture Hall 2 has a broken leg.", status: "Pending" },
  { id: 4, title: "Flickering corridor light", category: "Electrical", description: "The corridor light near the library flickers at night.", status: "Completed" },
  { id: 5, title: "Blocked sink in lab", category: "Plumbing", description: "The sink in Computer Lab 1 drains very slowly.", status: "In progress" },
  { id: 6, title: "Loose desk drawer", category: "Furniture", description: "The lecturer's desk drawer in Room A3 will not close.", status: "Pending" },
  { id: 7, title: "Socket not working", category: "Electrical", description: "The power socket near the window in Room C5 is dead.", status: "Completed" },
  { id: 8, title: "Burst pipe outside hostel", category: "Plumbing", description: "Water is flowing onto the path outside Hostel Block B.", status: "Pending" }
];

// 3. Helper functions (only used inside this file)
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveAll(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

function nextId(records) {
  if (records.length === 0) return 1;
  return Math.max(...records.map(r => r.id)) + 1;
}

// 4. Add starting records ONLY if the key does not exist yet
if (localStorage.getItem(KEY) === null) {
  saveAll(startingRecords);
}

// 5. The service that app.js will use
export const recordService = {
  async list() {
    return readAll();
  },

  async get(id) {
    const record = readAll().find(r => r.id === Number(id));
    if (!record) throw new Error("Record not found.");
    return record;
  },

  async create(record) {
    const records = readAll();
    const newRecord = {
      id: nextId(records),
      title: record.title,
      category: record.category,
      description: record.description,
      status: record.status
    };
    records.push(newRecord);
    saveAll(records);
    return newRecord;
  },

  async update(id, record) {
    const records = readAll();
    const index = records.findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error("Record not found.");
    records[index] = {
      id: records[index].id,
      title: record.title,
      category: record.category,
      description: record.description,
      status: record.status
    };
    saveAll(records);
    return records[index];
  },

  async remove(id) {
    const records = readAll();
    const index = records.findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error("Record not found.");
    records.splice(index, 1);
    saveAll(records);
    return { message: "Record deleted." };
  }
};