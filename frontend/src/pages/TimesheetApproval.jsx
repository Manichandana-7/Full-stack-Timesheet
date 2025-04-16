import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Box, Modal, Button, Typography, Paper } from "@mui/material";
import Rating from "@mui/material/Rating";
import Sidebar from './Sidebar';
import { CiStar } from "react-icons/ci";
import { v4 as uuidv4 } from "uuid";
import { AiOutlineClose } from 'react-icons/ai';
const labels = {
  1: "Terrible",
  2: "Bad",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

const TimesheetApproval = ({ managerId }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [foodRating, setFoodRating] = useState(0);
  const [foodHover, setFoodHover] = useState(-1);
  const [feedback, setFeedback] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState(new Set());
  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [existingReviews, setExistingReviews] = useState({});

  // Fetch timesheets and existing reviews on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const timesheetResponse = await api.get(`/approval/${managerId}`);

        // Ensure the response is an array of timesheets
        if (Array.isArray(timesheetResponse.data)) {
          setTimesheets(timesheetResponse.data);
        } else {
          setError("Unexpected data format");
        }

        const allReviews = await api.get(`/approval/performance-reviews/all/${managerId}`);
        const reviewMap = {};
        allReviews.data.forEach((review) => {
          reviewMap[`${review.timesheet_id}_${managerId}`] = true;
        });
        setExistingReviews(reviewMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [managerId]);

  const handleApprove = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setFoodRating(0);
    setFeedback("");
    setOpenModal(true);
  };

  const handleReject = async (timesheet) => {
    const reviewKey = `${timesheet.timesheet_id}_${managerId}`; // Adjusted to access timesheet_id directly
    if (existingReviews[reviewKey]) {
      alert("Review already submitted for this timesheet.");
      return;
    }

    try {
      const response = await api.post("/approval/performance-reviews", {
        timesheet_id: timesheet.timesheet_id, // Adjusted to access timesheet_id directly
        project_manager_id: managerId,
        rating: null,
        feedback: "Rejected",
        status: "Rejected",
      });

      if (response.status === 200) {
        alert("Timesheet rejected successfully.");
        setExistingReviews((prev) => ({
          ...prev,
          [reviewKey]: true,
        }));
        setSubmittedReviews((prev) =>
          new Set(prev).add(timesheet.timesheet_id) // Adjusted to access timesheet_id directly
        );
      }
    } catch (err) {
      console.error("Error rejecting timesheet:", err);
    }
  };

  const handleSubmitReview = async () => {
    if (foodRating < 3 && !feedback) {
      alert(" Please provide feedback for ratings below 3.");
      return;
    }

    const reviewKey = `${selectedTimesheet.timesheet_id}_${managerId}`; // Adjusted to access timesheet_id directly
    if (existingReviews[reviewKey]) {
      alert("This timesheet has already been reviewed.");
      return;
    }

    try {
      const response = await api.post("/approval/performance-reviews", {
        timesheet_id: selectedTimesheet.timesheet_id, // Adjusted to access timesheet_id directly
        project_manager_id: managerId,
        rating: foodRating,
        feedback: foodRating < 3 ? feedback : null,
        status: "Approved",
      });

      if (response.status === 200) {
        alert("Performance review submitted successfully.");
        setExistingReviews((prev) => ({
          ...prev,
          [reviewKey]: true,
        }));
        setSubmittedReviews((prev) =>
          new Set(prev).add(selectedTimesheet.timesheet_id) // Adjusted to access timesheet_id directly
        );
        setOpenModal(false);
        handleCloseModal();
      }
    } catch (err) {
      console.error("Error submitting performance review:", err);
    }
  };

  const handleViewProject = async (timesheetId) => {
    try {
      const response = await api.get(`/approval/${timesheetId}/${managerId}`);
      setProjectDetails(response.data);
      setOpenProjectModal(true);
    } catch (err) {
      console.error("Error fetching project details:", err);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCloseProjectModal = () => {
    setOpenProjectModal(false);
    setProjectDetails(null);
  };

  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'Segoe UI, sans-serif',
        backgroundColor: '#f9fafb',
      }}
    >
      <Sidebar />

      <main style={{ flex: 1, padding: '40px' }}>

    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h2 className="text-3xl font-semibold mb-6 text-center">Timesheets for approval</h2>

      <Paper >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead  className="bg-[#1b0c5a] text-white p-2">
            <tr>
              <th className="px-6 py-4 text-left text-md font-semibold">Employee Name</th>
              <th className="px-6 py-4 text-left text-md font-semibold">Week Start</th>
              <th className="px-6 py-4 text-left text-md font-semibold">Week End</th>
              <th className="px-6 py-4 text-left text-md font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-md font-semibold">Total Hours</th>
              <th className="px-6 py-4 text-left text-md font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((ts,index) => {
              const reviewKey = `${ts.timesheet_id}_${managerId}`;
              const isReviewed = !!existingReviews[reviewKey];
              return (
                <tr key={uuidv4()}  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-100 transition duration-200 cursor-pointer` } >
                  <td className="px-6 py-4 text-sm text-gray-800">{ts.employees.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{ts.week_start_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{ts.week_end_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{ts.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{ts.total_hours}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleApprove(ts)}
                      disabled={isReviewed}
                      style={{ marginRight: "10px" }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleReject(ts)}
                      disabled={isReviewed}
                      style={{ marginRight: "10px" }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleViewProject(ts.timesheet_id)} // Adjusted to access timesheet_id directly
                    >
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Paper>

      {/* Modal for Review */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            padding: 4,
            backgroundColor: "white",
            borderRadius: 2,
            maxWidth: 400,
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <Typography variant="h6" align="center" sx={{ marginBottom: 2 }}>
            Rate Timesheet ID: {selectedTimesheet?.timesheet_id}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
            <Rating
              name="food-rating"
              value={foodRating}
              precision={1}
              size="large"
              onChange={(event, newValue) => setFoodRating(newValue)}
              onChangeActive={(event, newHover) => setFoodHover(newHover)}
              emptyIcon={<CiStar style={{ opacity: 0.55 }} fontSize="inherit" />}
            />
            {foodRating !== null && (
              <Box sx={{ ml: 2 }}>{labels[foodHover !== -1 ? foodHover : foodRating]}</Box>
            )}
          </Box>
          {foodRating < 3 && (
            <div>
              <label>
                Feedback:
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  style={{ width: "100%", marginTop: "8px" }}
                />
              </label>
            </div>
          )}
          <Button variant="contained" onClick={handleSubmitReview} sx={{ marginTop: 2, width: "100%" }}>
            Submit Review
          </Button>
        </Box>
      </Modal>

      {/* Project Details Modal */}
      <Modal open={openProjectModal} onClose={handleCloseProjectModal}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxWidth: 800,
      maxHeight: '80vh',
      overflow: 'auto',
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 3,
      borderRadius: 2,
    }}
  >
    {/* Close Icon */}
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <AiOutlineClose
        size={24}
        style={{ cursor: 'pointer' }}
        onClick={handleCloseProjectModal}
      />
    </Box>
 
    <Typography
      variant="h6"
      gutterBottom
      sx={{ fontWeight: 'bold', mb: 2 }}
      className="text-center"
    >
      Project Details
    </Typography>
 
    {projectDetails && projectDetails.length > 0 ? (
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="bg-[#1b0c5a] text-white p-2">
              <tr >
                <th className="px-6 py-4 text-left text-sm font-semibold">Project Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Task Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Comments</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {projectDetails.map((entry,index) => (
                <tr key={entry.entry_id}
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-gray-100 transition duration-200 cursor-pointer` }>
                  <td className="px-6 py-4 text-sm text-gray-800">{entry.projects?.project_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{entry.tasks?.task_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{entry.comments || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {(entry.mon_hours || 0) + (entry.tue_hours || 0) + (entry.wed_hours || 0) +
                     (entry.thu_hours || 0) + (entry.fri_hours || 0) + (entry.sat_hours || 0) +
                     (entry.sun_hours || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>
    ) : (
      <Typography variant="body1" sx={{ mb: 2 }}>
        No project details available.
      </Typography>
    )}
  </Box>
</Modal>
    </div>
          </main>
    </div>
  );
};

export default TimesheetApproval;