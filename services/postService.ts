
import { Post, User } from '../types';
import { authService } from './authService';

const POSTS_STORAGE_KEY = 'nebula_posts';
const USERS_STORAGE_KEY = 'nebula_users';

// Initial Mock Data - Empty as requested
const INITIAL_POSTS: Post[] = [];

export const postService = {
  // Initialize storage if empty
  init: () => {
    if (!localStorage.getItem(POSTS_STORAGE_KEY)) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    }
  },

  // Get all posts for the public feed
  getAllPosts: (): Post[] => {
    postService.init();
    const postsJson = localStorage.getItem(POSTS_STORAGE_KEY);
    return postsJson ? JSON.parse(postsJson) : [];
  },

  // Get posts specific to a user
  getUserPosts: (username: string): Post[] => {
    const allPosts = postService.getAllPosts();
    return allPosts.filter(post => post.author === username);
  },

  // Get posts by a list of IDs (for favorites)
  getPostsByIds: (ids: string[]): Post[] => {
    const allPosts = postService.getAllPosts();
    return allPosts.filter(post => ids.includes(post.id));
  },

  // Create a new post
  createPost: (postData: Omit<Post, 'id' | 'timestamp' | 'likeCount'>): Post => {
    const posts = postService.getAllPosts();
    
    const newPost: Post = {
      ...postData,
      id: Date.now().toString(),
      timestamp: Date.now(),
      likeCount: 0
    };

    // Add to beginning of array
    posts.unshift(newPost);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    
    return newPost;
  },

  // Delete a post (Admin function)
  deletePost: (postId: string) => {
    const posts = postService.getAllPosts();
    const filteredPosts = posts.filter(p => p.id !== postId);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(filteredPosts));
  },

  // Toggle Like on a Post (Updates both Post and User)
  toggleLike: (postId: string, userId: string): { success: boolean; isLiked: boolean; newCount: number; updatedUser?: User } => {
    const posts = postService.getAllPosts();
    const users = authService.getUsers();
    
    const postIndex = posts.findIndex(p => p.id === postId);
    const userIndex = users.findIndex(u => u.id === userId);

    if (postIndex === -1 || userIndex === -1) {
      return { success: false, isLiked: false, newCount: 0 };
    }

    const user = users[userIndex];
    const post = posts[postIndex];

    // Initialize savedPostIds if not present (backward compatibility)
    if (!user.savedPostIds) user.savedPostIds = [];
    if (typeof post.likeCount !== 'number') post.likeCount = 0;

    const isLiked = user.savedPostIds.includes(postId);
    let newIsLiked = false;

    if (isLiked) {
      // Unlike: Remove from saved, decrement count
      user.savedPostIds = user.savedPostIds.filter(id => id !== postId);
      post.likeCount = Math.max(0, post.likeCount - 1);
      newIsLiked = false;
    } else {
      // Like: Add to saved, increment count
      user.savedPostIds.push(postId);
      post.likeCount += 1;
      newIsLiked = true;
    }

    // Save changes to storage
    users[userIndex] = user;
    posts[postIndex] = post;

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));

    // Update Session if it's the current user
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      authService.updateSessionUser(user);
    }

    return { 
      success: true, 
      isLiked: newIsLiked, 
      newCount: post.likeCount,
      updatedUser: user
    };
  }
};
