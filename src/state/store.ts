import { configureStore } from '@reduxjs/toolkit'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { OpenAPI } from './openapi'

// Schema reducers + selectors.
interface SchemaState {
  value: OpenAPI | null
  state: 'unset' | 'set'
}

const initialState: SchemaState = {
  value: null,
  state: 'unset'
}

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    setSchema: (state, action: PayloadAction<OpenAPI>) => {
      state.value = action.payload
      state.state = 'set';
    }
  }
})

const {setSchema} = schemaSlice.actions;
const schemaReducer = schemaSlice.reducer;

export const selectResources = (state: RootState) => {
  if (state.schema.value != null) {
    return state.schema.value.resources();
  } else {
    return [];
  }
}

export const schemaState = (state: RootState) => state.schema.state

// Headers reducers + selectors.
interface HeadersState {
  value: string
}

const initialHeadersState: HeadersState = {
  value: ""
}

const headersSlice = createSlice({
  name: 'headers',
  initialState: initialHeadersState,
  reducers: {
    setHeaders: (state, action: PayloadAction<string>) => {
      state.value = action.payload
    }
  }
})

const {setHeaders} = headersSlice.actions;
const headersReducer = headersSlice.reducer;

export const selectHeaders = (state: RootState) => state.headers.value;

// Store
const store = configureStore({
    reducer: {
        schema: schemaReducer,
        headers: headersReducer
    }
})


export {setSchema, schemaReducer, store, setHeaders}


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch