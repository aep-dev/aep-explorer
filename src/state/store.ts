import { configureStore } from '@reduxjs/toolkit'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { OpenAPI, ResourceSchema } from './openapi'

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

export const selectChildResources = (state: RootState, resource: ResourceSchema, id: string) => {
  if (state.schema.value != null) {
    return state.schema.value.childResources(resource, id);
  } else {
    return [];
  }
}

export const selectRootResources = (state: RootState) => {
  if (state.schema.value != null) {
    return state.schema.value.parentResources();
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

// Mock Server reducers + selectors.
interface MockServerState {
  enabled: boolean
}

const initialMockServerState: MockServerState = {
  enabled: false
}

const mockServerSlice = createSlice({
  name: 'mockServer',
  initialState: initialMockServerState,
  reducers: {
    setMockServerEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload
    }
  }
})

const {setMockServerEnabled} = mockServerSlice.actions;
const mockServerReducer = mockServerSlice.reducer;

export const selectMockServerEnabled = (state: RootState) => state.mockServer.enabled;

// Store
const store = configureStore({
    reducer: {
        schema: schemaReducer,
        headers: headersReducer,
        mockServer: mockServerReducer
    }
})


export {setSchema, schemaReducer, store, setHeaders, setMockServerEnabled}


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch