export const typeDefs = /* GraphQL */ `
  scalar Date

  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: Date
    updatedAt: Date
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    createdAt: Date
    updatedAt: Date
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Public queries
  type Query {
    health: String!
    posts: [Post!]!
    post(id: ID!): Post
    me: User
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreatePostInput {
    title: String!
    content: String!
  }

  input UpdatePostInput {
    id: ID!
    title: String
    content: String
  }

  # Public mutations: register, login
  # Private mutations: createPost, updatePost, deletePost
  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!  # client-side token discard

    createPost(input: CreatePostInput!): Post!      # private
    updatePost(input: UpdatePostInput!): Post!      # private + owner
    deletePost(id: ID!): Boolean!                   # private + owner
  }
`;
