import { createSlice } from '@reduxjs/toolkit';

interface SocketState {
  connected: boolean;
}

const initialState: SocketState = {
  connected: false
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocketConnected: (state, action: { payload: boolean }) => {
      state.connected = action.payload;
    }
  }
});

export const { setSocketConnected } = socketSlice.actions;
export default socketSlice.reducer;
