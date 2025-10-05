import React, { useEffect, useRef, useState } from 'react'
import { deleteEmployee, listEmployees } from '../Services/EmployeeService'
import { useNavigate } from 'react-router-dom'

const ListEmployeeComponent = () => {
  const [employees, setEmployees] = useState([])
  const [deletedEmployee, setDeletedEmployee] = useState(null)
  const [showUndo, setShowUndo] = useState(false)
  const [progress, setProgress] = useState(100)

  const navigator = useNavigate()

  // refs to keep timer/interval ids so we can cancel them when Undo is clicked
  const undoTimeoutRef = useRef(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    getAllEmployees()

    // cleanup on unmount
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  function getAllEmployees() {
    listEmployees()
      .then((response) => setEmployees(response.data))
      .catch((err) => console.error(err))
  }

  function addNewEmployee() {
    navigator('/add-employee')
  }

  function updateEmployee(id) {
    navigator(`/update-employee/${id}`)
  }

  function removeEmployee(id) {
    const empToDelete = employees.find((e) => e.id === id)
    if (!empToDelete) return

    // If there is already a pending undo, finalize that deletion immediately
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
      clearInterval(progressIntervalRef.current)
      // finalize previous
      if (deletedEmployee) {
        deleteEmployee(deletedEmployee.id).catch((err) => console.error(err))
      }
      setShowUndo(false)
      setDeletedEmployee(null)
    }

    // Remove from UI optimistically
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    setDeletedEmployee(empToDelete)
    setShowUndo(true)
    setProgress(100)

    const DURATION = 3000 // ms
    const startTs = Date.now()

    // progress updater (smooth)
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTs
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(pct)
    }, 50)

    // schedule final delete
    undoTimeoutRef.current = setTimeout(() => {
      deleteEmployee(id)
        .then(() => {
          // deletion succeeded
        })
        .catch((err) => {
          console.error('delete failed:', err)
          // if delete failed, restore the row in UI
          setEmployees((prev) => [empToDelete, ...prev])
        })
        .finally(() => {
          // clear state & timers
          setShowUndo(false)
          setDeletedEmployee(null)
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          undoTimeoutRef.current = null
          setProgress(100)
        })
    }, DURATION)
  }

  function undoDelete() {
    // cancel scheduled delete & progress updater
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    // restore in UI (no backend call required because we didn't delete yet)
    if (deletedEmployee) {
      setEmployees((prev) => [deletedEmployee, ...prev])
    }

    setDeletedEmployee(null)
    setShowUndo(false)
    setProgress(100)
  }

  return (
    <div className='container'>
      <h2>List of employees</h2>
      <button className='btn btn-primary mb-2' onClick={addNewEmployee}>
        Add Employee
      </button>

      <table className='table table-striped table-bordered'>
        <thead>
          <tr>
            <th>Employee Id</th>
            <th>Employee First Name</th>
            <th>Employee Last Name</th>
            <th>Employee Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.firstName}</td>
              <td>{employee.lastName}</td>
              <td>{employee.email}</td>
              <td>
                <button className='btn btn-info' onClick={() => updateEmployee(employee.id)}>
                  Update
                </button>
                <button
                  className='btn btn-danger'
                  onClick={() => removeEmployee(employee.id)}
                  style={{ marginLeft: '10px' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Undo snackbar */}
      {showUndo && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
            width: '340px',
            zIndex: 1000,
            textAlign: 'center'
          }}
        >
          <span>Employee deleted.</span>
          <button
            onClick={undoDelete}
            style={{
              marginLeft: '12px',
              background: 'transparent',
              color: '#4caf50',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Undo
          </button>

          {/* shrinking progress bar */}
          <div style={{ marginTop: '10px', height: '6px', background: '#555', borderRadius: '4px' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#4caf50',
                borderRadius: '4px',
                transition: 'width 50ms linear'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ListEmployeeComponent
