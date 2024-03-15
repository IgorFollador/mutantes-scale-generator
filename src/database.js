const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/mutantes-scale-db.sqlite');

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS schedules (date TEXT, vest TEXT, pp TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS last_pair (vest TEXT, pp TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS members (name TEXT, type TEXT)", () => {
    //     // Populando a tabela de membros
    //     const members = [
    //         { name: "Zoio", type: "Closed Vest" },
    //         { name: "Barbeiro", type: "Closed Vest" },
    //         { name: "Cuba", type: "Closed Vest" },
    //         { name: "Jao", type: "PP" },
    //         { name: "Cancela", type: "PP" },
    //         { name: "Pontaria", type: "PP" }
    //     ];
  
    //   const stmt = db.prepare("INSERT INTO members (name, type) VALUES (?, ?)");
    //   members.forEach(member => {
    //     stmt.run(member.name, member.type);
    //   });
    //   stmt.finalize();
    });
});
  

module.exports = db;
