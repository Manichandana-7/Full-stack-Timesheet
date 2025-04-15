import React, { useEffect, useState } from 'react';
import api from '../api/axios'; 
import { Box, Modal, Button, Typography } from '@mui/material'; // Import necessary MUI components
import Rating from '@mui/material/Rating'; // Import Rating from Material-UI
import { CiStar } from 'react-icons/ci'; // Import your star icon

const labels = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

const TimesheetApproval = ({ managerId }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [foodRating, setFoodRating] = useState(0);
  const [foodHover, setFoodHover] = useState(-1);
  const [feedback, setFeedback] = useState('');
  const [openModal, setOpenModal] = useState(false); // State to control modal visibility
  const [submittedReviews, setSubmittedReviews] = useState(new Set()); // Track submitted reviews

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const response = await api.get(`/approval/${managerId}`);
        setTimesheets(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, [managerId]);

  const handleApprove = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setFoodRating(0); 
    setFeedback('');
    setOpenModal(true); // Open the modal
  };

  const handleSubmitReview = async () => {
    if (foodRating < 3 && !feedback) {
      alert('Please provide feedback for ratings below 3.');
      return;
    }

    try {
      const response = await api.post('/approval/performance-reviews', {
        timesheet_id: selectedTimesheet.timesheets.timesheet_id,
        project_manager_id: managerId,
        rating: foodRating,
        feedback: foodRating < 3 ? feedback : null,
      });

      if (response.status === 200) {
        alert('Performance review submitted successfully.');
        setSubmittedReviews(prev => new Set(prev).add(selectedTimesheet.timesheets.timesheet_id)); // Mark this timesheet as reviewed
        setOpenModal(false); // Close the modal after submission
      }
    } catch (err) {
      console.error('Error submitting performance review:', err);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false); // Close the modal
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Timesheet Approval</h1>
      <table>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Week Start</th>
            <th>Week End</th>
            <th>Status</th>
            <th>Total Hours</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {timesheets.map(ts => (
            <tr key={ts.timesheets.timesheet_id}>
              <td>{ts.timesheets.employees.name}</td>
              <td>{ts.timesheets.week_start_date}</td>
              <td>{ts.timesheets.week_end_date}</td>
              <td>{ts.timesheets.status}</td>
              <td>{ts.timesheets.total_hours}</td>
              <td>
                <button 
                  onClick={() => handleApprove(ts)} 
                  disabled={submittedReviews.has(ts.timesheets.timesheet_id)} // Disable if reviewed
                >
                  Approve
                </button>
                <button onClick={() => {/* Logic to view project details */}}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={{ padding: 4, backgroundColor: 'white', borderRadius: 2, maxWidth: 400, margin: 'auto', marginTop: '20%' }}>
          <Typography variant="h6">Rate Timesheet ID: {selectedTimesheet?.timesheets.timesheet_id}</Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Rating
              name="food-rating"
              value={foodRating}
              precision={1}
              size="large"
              onChange={(event, newValue) => setFoodRating(newValue)}
              onChangeActive={(event, newHover) => setFoodHover(newHover)}
              emptyIcon={
                <CiStar style={{ opacity: 0.55 }} fontSize="inherit" />
              }
            />
            {foodRating !== null && (
              <Box sx={{ ml: 2 }} className="text-xl">
                {labels[foodHover !== -1 ? foodHover : foodRating]}
              </Box>
            )}
          </Box>
          {foodRating < 3 && (
            <div>
              <label>
                Feedback:
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </label>
            </div>
          )}
          <Button variant="contained" onClick={handleSubmitReview} sx={{ marginTop: 2 }}>Submit Review</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default TimesheetApproval;