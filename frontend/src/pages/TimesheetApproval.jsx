import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Box, Modal, Button, Typography, Paper } from "@mui/material";
import Rating from "@mui/material/Rating";
import { CiStar } from "react-icons/ci";
import { v4 as uuidv4 } from "uuid";

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
        setTimesheets(timesheetResponse.data);

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
    const reviewKey = `${timesheet.timesheets.timesheet_id}_${managerId}`;
    if (existingReviews[reviewKey]) {
      alert("Review already submitted for this timesheet.");
      return;
    }

    try {
      const response = await api.post("/approval/performance-reviews", {
        timesheet_id: timesheet.timesheets.timesheet_id,
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
          new Set(prev).add(timesheet.timesheets.timesheet_id)
        );
      }
    } catch (err) {
      console.error("Error rejecting timesheet:", err);
    }
  };

  const handleSubmitReview = async () => {
    if (foodRating < 3 && !feedback) {
      alert("Please provide feedback for ratings below 3.");
      return;
    }

    const reviewKey = `${selectedTimesheet.timesheets.timesheet_id}_${managerId}`;
    if (existingReviews[reviewKey]) {
      alert("This timesheet has already been reviewed.");
      return;
    }

    try {
      const response = await api.post("/approval/performance-reviews", {
        timesheet_id: selectedTimesheet.timesheets.timesheet_id,
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
          new Set(prev).add(selectedTimesheet.timesheets.timesheet_id)
        );
        setOpenModal(false);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <Typography variant="h4" gutterBottom align="center" style={{ fontWeight: "bold", color: "#4CAF50" }}>
        Timesheet Approval
      </Typography>

      <Paper sx={{ padding: 2 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Employee Name</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Week Start</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Week End</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Status</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Total Hours</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((ts) => {
              const reviewKey = `${ts.timesheets.timesheet_id}_${managerId}`;
              const isReviewed = !!existingReviews[reviewKey];
              return (
                <tr key={uuidv4()} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "10px" }}>{ts.timesheets.employees.name}</td>
                  <td style={{ padding: "10px" }}>{ts.timesheets.week_start_date}</td>
                  <td style={{ padding: "10px" }}>{ts.timesheets.week_end_date}</td>
                  <td style={{ padding: "10px" }}>{ts.timesheets.status}</td>
                  <td style={{ padding: "10px" }}>{ts.timesheets.total_hours}</td>
                  <td style={{ padding: "10px" }}>
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
                      onClick={() => handleViewProject(ts.timesheets.timesheet_id)}
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
            Rate Timesheet ID: {selectedTimesheet?.timesheets.timesheet_id}
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
            padding: 4,
            backgroundColor: "white",
            borderRadius: 2,
            maxWidth: 600,
            margin: "auto",
            marginTop: "5%",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Project Details
          </Typography>
          {projectDetails && projectDetails.length > 0 ? (
            projectDetails.map((entry) => (
              <div key={entry.entry_id} style={{ marginBottom: "20px" }}>
                <Typography variant="body1"><strong>Project Name:</strong> {entry.projects.project_name}</Typography>
                <Typography variant="body1"><strong>Task Name:</strong> {entry.tasks.task_name}</Typography>
                <Typography variant="body1"><strong>Comments:</strong> {entry.comments}</Typography>
                <Typography variant="body1"><strong>Total Hours:</strong>{" "}
                  {(entry.mon_hours || 0) + (entry.tue_hours || 0) + (entry.wed_hours || 0) + (entry.thu_hours || 0) + (entry.fri_hours || 0) + (entry.sat_hours || 0) + (entry.sun_hours || 0)}
                </Typography>
              </div>
            ))
          ) : (
            <Typography variant="body1">No project details available.</Typography>
          )}
          <Button variant="contained" onClick={handleCloseProjectModal} sx={{ marginTop: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default TimesheetApproval;
