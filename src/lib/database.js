
const { Client } = require('pg');

class Database {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (this.client) return this.client;
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    this.client = new Client({ 
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await this.client.connect();
      console.log('Connected to PostgreSQL database');
      return this.client;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.client = null;
      console.log('Disconnected from database');
    }
  }

  async query(text, params = []) {
    const client = await this.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // פונקציות עזר לטבלאות
  async createTables() {
    const queries = [
      // טבלת משתמשים
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_manager BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // טבלת רישומי נוכחות
      `CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        clock_in TIMESTAMP NOT NULL,
        clock_out TIMESTAMP,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // טבלת דיווחים ידניים
      `CREATE TABLE IF NOT EXISTS manual_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date_in DATE NOT NULL,
        time_in TIME NOT NULL,
        date_out DATE NOT NULL,
        time_out TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.query(query);
    }
    
    console.log('Database tables created successfully');
  }

  // פונקציות למשתמשים
  async createUser(employeeId, name, password, isManager = false) {
    const query = `
      INSERT INTO users (employee_id, name, password, is_manager)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.query(query, [employeeId, name, password, isManager]);
    return result.rows[0];
  }

  async getUserByEmployeeId(employeeId) {
    const query = 'SELECT * FROM users WHERE employee_id = $1 AND is_active = TRUE';
    const result = await this.query(query, [employeeId]);
    return result.rows[0];
  }

  // פונקציות לנוכחות
  async clockIn(userId) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    const query = `
      INSERT INTO attendance_records (user_id, clock_in, date)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.query(query, [userId, now, date]);
    return result.rows[0];
  }

  async clockOut(userId) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    const query = `
      UPDATE attendance_records 
      SET clock_out = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND date = $3 AND clock_out IS NULL
      RETURNING *
    `;
    const result = await this.query(query, [now, userId, date]);
    return result.rows[0];
  }

  async getTodayAttendance(userId) {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT * FROM attendance_records 
      WHERE user_id = $1 AND date = $2
      ORDER BY clock_in DESC
      LIMIT 1
    `;
    const result = await this.query(query, [userId, today]);
    return result.rows[0];
  }

  // פונקציות לדיווחים ידניים
  async createManualReport(userId, dateIn, timeIn, dateOut, timeOut, reason = null) {
    const query = `
      INSERT INTO manual_reports (user_id, date_in, time_in, date_out, time_out, reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.query(query, [userId, dateIn, timeIn, dateOut, timeOut, reason]);
    return result.rows[0];
  }

  async getManualReports(status = null) {
    let query = `
      SELECT mr.*, u.name, u.employee_id 
      FROM manual_reports mr 
      JOIN users u ON mr.user_id = u.id
    `;
    const params = [];
    
    if (status) {
      query += ' WHERE mr.status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY mr.created_at DESC';
    
    const result = await this.query(query, params);
    return result.rows;
  }
}

// יצירת instance יחיד
const database = new Database();

module.exports = database;
