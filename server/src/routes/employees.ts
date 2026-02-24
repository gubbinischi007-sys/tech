import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../database.js';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
    try {
        const employees = await all('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Create new employee (Onboard)
router.post('/', async (req, res) => {
    const { applicant_id, name, email, job_title, department, hired_date, status } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        // Check if employee already exists by email
        const existing = await get('SELECT * FROM employees WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ error: 'Employee with this email already exists' });
        }

        const id = uuidv4();
        await run(
            `INSERT INTO employees (id, applicant_id, name, email, job_title, department, hired_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, applicant_id || null, name, email, job_title, department, hired_date || new Date().toISOString(), status || 'active']
        );

        const newEmployee = await get('SELECT * FROM employees WHERE id = ?', [id]);
        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// Update employee
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, job_title, department, hired_date, status } = req.body;

    try {
        const employee = await get('SELECT * FROM employees WHERE id = ?', [id]);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        await run(
            `UPDATE employees 
             SET name = COALESCE(?, name),
                 email = COALESCE(?, email),
                 job_title = COALESCE(?, job_title),
                 department = COALESCE(?, department),
                 hired_date = COALESCE(?, hired_date),
                 status = COALESCE(?, status)
             WHERE id = ?`,
            [name, email, job_title, department, hired_date, status, id]
        );

        const updatedEmployee = await get('SELECT * FROM employees WHERE id = ?', [id]);
        res.json(updatedEmployee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const employee = await get('SELECT * FROM employees WHERE id = ?', [id]);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        await run('DELETE FROM employees WHERE id = ?', [id]);
        res.json({ message: 'Employee removed successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

export default router;
