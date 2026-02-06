import React from 'react';
import { Blog } from '../types';

interface BlogListProps {
    blogs: Blog[];
    isAdmin: boolean;
    onSelectBlog: (id: string) => void;
    onCreateNew: () => void;
    onBack: () => void;
}

const BlogList: React.FC<BlogListProps> = ({ blogs, isAdmin, onSelectBlog, onCreateNew, onBack }) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getExcerpt = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={onBack}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">Blog</h1>
                    <p className="text-slate-500 mt-1">Read the latest updates and insights</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onCreateNew}
                        className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary-shadow)] flex items-center gap-2"
                    >
                        <span className="text-xl leading-none">+</span> New Post
                    </button>
                )}
            </div>

            {blogs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-[var(--primary-soft)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-[var(--primary-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No blog posts yet</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        {isAdmin
                            ? "Create your first blog post to share updates with your users."
                            : "Check back soon for updates and insights."
                        }
                    </p>
                    {isAdmin && (
                        <button
                            onClick={onCreateNew}
                            className="mt-8 px-8 py-3 bg-[var(--primary)] text-white rounded-2xl font-bold hover:opacity-90 transition-all"
                        >
                            Write First Post
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map((blog) => (
                        <div
                            key={blog.id}
                            onClick={() => onSelectBlog(blog.id)}
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-[var(--primary-shadow)] transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-[var(--primary-soft)] text-[var(--primary-text)] text-[10px] font-bold rounded-full uppercase tracking-widest">
                                    Blog
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formatDate(blog.createdAt)}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-[var(--primary-text)] transition-colors mb-2 line-clamp-2">
                                {blog.title}
                            </h3>
                            <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                                {getExcerpt(blog.content)}
                            </p>

                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    By {blog.authorName || blog.authorEmail.split('@')[0]}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[var(--primary-text)] flex items-center gap-1 uppercase tracking-tighter">
                                    Read More <span>→</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogList;
