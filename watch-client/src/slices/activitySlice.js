import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const uploadActivityData = createAsyncThunk(
  "activity/uploadData",
  async (csvData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/v0.1/activity/upload",
        { csv_file: csvData }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload data"
      );
    }
  }
);

export const fetchActivitySummary = createAsyncThunk(
  "activity/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v0.1/activity/summary"
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch summary"
      );
    }
  }
);

export const fetchDailyTrends = createAsyncThunk(
  "activity/fetchDailyTrends",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v0.1/activity/daily-trends"
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch daily trends"
      );
    }
  }
);

export const fetchWeeklyTrends = createAsyncThunk(
  "activity/fetchWeeklyTrends",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v0.1/activity/weekly-trends"
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch weekly trends"
      );
    }
  }
);

// Generate predictions
export const generatePredictions = createAsyncThunk(
  "activity/generatePredictions",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post("http://localhost:8000/api/v0.1/predictions/generate");
      const response = await axios.get("http://localhost:8000/api/v0.1/predictions");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate predictions"
      );
    }
  }
);

export const fetchPredictions = createAsyncThunk(
  "activity/fetchPredictions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v0.1/predictions"
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch predictions"
      );
    }
  }
);

const activitySlice = createSlice({
  name: "activity",
  initialState: {
    summary: null,
    dailyTrends: [],
    weeklyTrends: [],
    predictions: [],
    uploadStatus: {
      loading: false,
      success: false,
      error: null,
      message: "",
    },
    loading: {
      summary: false,
      dailyTrends: false,
      weeklyTrends: false,
      predictions: false,
    },
    error: {
      summary: null,
      dailyTrends: null,
      weeklyTrends: null,
      predictions: null,
    },
  },
  reducers: {
    clearUploadStatus: (state) => {
      state.uploadStatus = {
        loading: false,
        success: false,
        error: null,
        message: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload activity data
      .addCase(uploadActivityData.pending, (state) => {
        state.uploadStatus.loading = true;
        state.uploadStatus.success = false;
        state.uploadStatus.error = null;
        state.uploadStatus.message = "Uploading...";
      })
      .addCase(uploadActivityData.fulfilled, (state, action) => {
        state.uploadStatus.loading = false;
        state.uploadStatus.success = true;
        state.uploadStatus.message = `Upload successful! ${action.payload.stats.processed} records processed.`;
      })
      .addCase(uploadActivityData.rejected, (state, action) => {
        state.uploadStatus.loading = false;
        state.uploadStatus.success = false;
        state.uploadStatus.error = action.payload;
        state.uploadStatus.message = `Upload failed: ${action.payload}`;
      })

      // Activity summary
      .addCase(fetchActivitySummary.pending, (state) => {
        state.loading.summary = true;
        state.error.summary = null;
      })
      .addCase(fetchActivitySummary.fulfilled, (state, action) => {
        state.loading.summary = false;
        state.summary = action.payload;
      })
      .addCase(fetchActivitySummary.rejected, (state, action) => {
        state.loading.summary = false;
        state.error.summary = action.payload;
      })

      // Daily trends
      .addCase(fetchDailyTrends.pending, (state) => {
        state.loading.dailyTrends = true;
        state.error.dailyTrends = null;
      })
      .addCase(fetchDailyTrends.fulfilled, (state, action) => {
        state.loading.dailyTrends = false;
        state.dailyTrends = action.payload;
      })
      .addCase(fetchDailyTrends.rejected, (state, action) => {
        state.loading.dailyTrends = false;
        state.error.dailyTrends = action.payload;
      })

      // Weekly trends
      .addCase(fetchWeeklyTrends.pending, (state) => {
        state.loading.weeklyTrends = true;
        state.error.weeklyTrends = null;
      })
      .addCase(fetchWeeklyTrends.fulfilled, (state, action) => {
        state.loading.weeklyTrends = false;
        state.weeklyTrends = action.payload;
      })
      .addCase(fetchWeeklyTrends.rejected, (state, action) => {
        state.loading.weeklyTrends = false;
        state.error.weeklyTrends = action.payload;
      })

      // Generate predictions
      .addCase(generatePredictions.pending, (state) => {
        state.loading.predictions = true;
        state.error.predictions = null;
      })
      .addCase(generatePredictions.fulfilled, (state, action) => {
        state.loading.predictions = false;
        state.predictions = action.payload;
      })
      .addCase(generatePredictions.rejected, (state, action) => {
        state.loading.predictions = false;
        state.error.predictions = action.payload;
      })

      // Fetch predictions
      .addCase(fetchPredictions.pending, (state) => {
        state.loading.predictions = true;
        state.error.predictions = null;
      })
      .addCase(fetchPredictions.fulfilled, (state, action) => {
        state.loading.predictions = false;
        state.predictions = action.payload;
      })
      .addCase(fetchPredictions.rejected, (state, action) => {
        state.loading.predictions = false;
        state.error.predictions = action.payload;
      });
  },
});

export const { clearUploadStatus } = activitySlice.actions;
export default activitySlice.reducer;