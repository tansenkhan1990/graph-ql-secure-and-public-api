import { GraphQLError } from 'graphql';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { signToken, requireAuth } from '../../../utils/auth.js';
import {
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema
} from '../../../utils/validate.js';

// Helper: throw a GraphQL-friendly error
function badRequest(message) {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

export const resolvers = {
  Query: {
    health: () => 'OK',
    posts: async () => {
      return Post.find().populate('author').sort({ createdAt: -1 });
    },
    post: async (_, { id }) => {
      return Post.findById(id).populate('author');
    },
    me: async (_, __, ctx) => {
      // Public query that returns null if not logged in (useful for clients)
      return ctx.user || null;
    }
  },

  Mutation: {
    // PUBLIC: register
    register: async (_, { input }) => {
      const parsed = registerSchema.safeParse(input);
      if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

      const { name, email, password } = parsed.data;

      const exists = await User.findOne({ email });
      if (exists) throw badRequest('Email already registered');

      const user = await User.create({ name, email, password });
      const token = signToken(user.id);

      // Important: never return password
      return { token, user };
    },

    // PUBLIC: login
    login: async (_, { input }) => {
      const parsed = loginSchema.safeParse(input);
      if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

      const { email, password } = parsed.data;

      // Need +password because schema has select:false
      const user = await User.findOne({ email }).select('+password');
      if (!user) throw badRequest('Invalid credentials');

      const ok = await user.comparePassword(password);
      if (!ok) throw badRequest('Invalid credentials');

      const token = signToken(user.id);
      // remove password from memory response
      user.password = undefined;

      return { token, user };
    },

    // PUBLIC (server-side): logout is stateless; client should discard token
    logout: async () => true,

    // PRIVATE: createPost (must be logged in)
    createPost: async (_, { input }, ctx) => {
      requireAuth(ctx);

      const parsed = createPostSchema.safeParse(input);
      if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

      const post = await Post.create({
        ...parsed.data,
        author: ctx.user._id
      });

      // populate author so client gets it in one round
      return post.populate('author');
    },

    // PRIVATE + OWNER: updatePost
    updatePost: async (_, { input }, ctx) => {
      requireAuth(ctx);

      const parsed = updatePostSchema.safeParse(input);
      if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

      const post = await Post.findById(parsed.data.id);
      if (!post) throw badRequest('Post not found');

      // Authorization: only author can update
      if (post.author.toString() !== ctx.user._id.toString()) {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
      }

      if (parsed.data.title !== undefined) post.title = parsed.data.title;
      if (parsed.data.content !== undefined) post.content = parsed.data.content;

      await post.save();
      return post.populate('author');
    },

    // PRIVATE + OWNER: deletePost
    deletePost: async (_, { id }, ctx) => {
      requireAuth(ctx);

      const post = await Post.findById(id);
      if (!post) return false;

      if (post.author.toString() !== ctx.user._id.toString()) {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
      }

      await post.deleteOne();
      return true;
    }
  }
};
