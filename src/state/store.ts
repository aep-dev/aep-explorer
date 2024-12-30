import { configureStore } from '@reduxjs/toolkit'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { OpenAPI } from './openapi'

interface SchemaState {
  value: OpenAPI | null
}

const initialState: SchemaState = {
  value: null
}

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    setSchema: (state, action: PayloadAction<OpenAPI>) => {
      state.value = action.payload
    }
  }
})

export const store = configureStore({
    reducer: {
        schema: schemaSlice.reducer,
    }
})
export const { setSchema } = schemaSlice.actions

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch