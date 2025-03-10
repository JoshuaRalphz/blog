"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { format } from 'date-fns';
import { useUser, SignedIn, SignedOut, SignInButton, useClerk } from '@clerk/nextjs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@supabase/supabase-js';
import BlogCard from '@/components/BlogCard';

import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';


// Add this function to calculate weekly hours
const calculateWeeklyHours = (hoursData) => {
  const weeks = {};
  
  hoursData.forEach(entry => {
    const date = new Date(entry.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        startDate: weekStart,
        totalHours: 0
      };
    }
    
    weeks[weekKey].totalHours += entry.hours;
  });
  
  return Object.values(weeks).sort((a, b) => a.startDate - b.startDate);
};

const CalendarComponent = dynamic(() => import('@/components/CalendarComponent'), {
  loading: () => <p>Loading calendar...</p>,
  ssr: false
});

export default function Home() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Blog date range
  const startDate = new Date(2025, 1, 5); // Feb 5, 2025
  const endDate = new Date(2025, 3, 15);  // April 15, 2025
  
  // Add useState for dynamic values
  const [hoursData, setHoursData] = useState([]);
  const [loadingHours, setLoadingHours] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [weeklyPosts, setWeeklyPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  const router = useRouter();

  // Move this line above the useMemo hook
  const totalRequiredHours = 400;

  // Memoize calculated values
  const { hoursCompleted, hoursRemaining, completionPercentage } = useMemo(() => {
    const completed = Array.isArray(hoursData) ? 
      hoursData.reduce((sum, entry) => sum + (entry?.hours || 0), 0) : 0;
    const remaining = totalRequiredHours - completed;
    const percentage = Math.round((completed / totalRequiredHours) * 100);
    return { hoursCompleted: completed, hoursRemaining: remaining, completionPercentage: percentage };
  }, [hoursData]);

  // Memoize weekly hours calculation
  const weeklyHours = useMemo(() => calculateWeeklyHours(hoursData || []), [hoursData]);

  // Memoize scheduled posts
  const scheduledPosts = useMemo(() => 
    posts.filter(post => {
      const postDate = new Date(post.publish_date);
      return post.status === 'scheduled' && postDate > new Date();
    }), 
  [posts]);

  // Optimize event handlers with useCallback
  const handleDeletePost = useCallback((deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
    setWeeklyPosts(prevWeeks => 
      prevWeeks.map(week => ({
        ...week,
        posts: week.posts.filter(post => post.id !== deletedPostId)
      }))
    );
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
      toast.error('Failed to sign out');
    }
  }, [signOut, router]);

  // Modify the useEffect to fetch data without authentication check
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hoursResponse, postsResponse] = await Promise.all([
          fetch('/api/hours'),
          fetch('/api/blog/posts')
        ]);

        if (!hoursResponse.ok || !postsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [hoursData, postsData] = await Promise.all([
          hoursResponse.json(),
          postsResponse.json()
        ]);

        setHoursData(hoursData.data || []);
        
        const processedPosts = postsData.data.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          publish_date: post.publish_date || post.published_at,
          status: post.status || (new Date(post.publish_date) > new Date() ? 'scheduled' : 'published'),
          hours: post.hours || 0,
          tags: post.tags || [],
          excerpt: post.excerpt || ''
        }));

        const postsByWeek = processedPosts.reduce((weeks, post) => {
          const postDate = new Date(post.publish_date);
          const weekStart = new Date(postDate);
          weekStart.setDate(postDate.getDate() - postDate.getDay());
          
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          
          if (!weeks[weekKey]) {
            weeks[weekKey] = {
              startDate: weekStart,
              posts: []
            };
          }
          
          weeks[weekKey].posts.push(post);
          return weeks;
        }, {});

        setWeeklyPosts(Object.values(postsByWeek).sort((a, b) => a.startDate - b.startDate));
        setPosts(processedPosts);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingPosts(false);
        setLoadingHours(false);
      }
    };

    fetchData();
  }, []);
  
  // Calculate totals with safe defaults

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );

  // Modify the posts fetching useEffect similarly
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const response = await fetch('/api/blog/posts');
        const { data } = await response.json();
        
        // Ensure data is a plain object
        const plainData = JSON.parse(JSON.stringify(data));
        
        const processedPosts = plainData.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          publish_date: post.publish_date || post.published_at,
          status: post.status || (new Date(post.publish_date) > new Date() ? 'scheduled' : 'published'),
          hours: post.hours || 0,
          tags: post.tags || [],
          excerpt: post.excerpt || ''
        }));

        // Group posts by week
        const postsByWeek = processedPosts.reduce((weeks, post) => {
          const postDate = new Date(post.publish_date);
          const weekStart = new Date(postDate);
          weekStart.setDate(postDate.getDate() - postDate.getDay());
          
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          
          if (!weeks[weekKey]) {
            weeks[weekKey] = {
              startDate: weekStart,
              posts: []
            };
          }
          
          weeks[weekKey].posts.push(post);
          return weeks;
        }, {});

        const sortedWeeks = Object.values(postsByWeek).sort((a, b) => a.startDate - b.startDate);
        setWeeklyPosts(sortedWeeks);
        setPosts(processedPosts);
        
        if (sortedWeeks.length > 0) {
          setCurrentWeek(sortedWeeks.length - 1);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load blog posts');
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    // Remove the isSignedIn check
    fetchPosts();
  }, []);

  // Add this useEffect to handle filtering when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const filtered = posts.filter(post => {
        const postDate = new Date(post.publish_date);
        return postDate.toDateString() === selectedDate.toDateString();
      });
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(weeklyPosts[currentWeek]?.posts || []);
    }
  }, [selectedDate, posts, weeklyPosts, currentWeek]);

  if (loadingPosts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Update the renderPosts function to use filteredPosts
  const renderPosts = () => (
    <div className="space-y-6">
      {loadingPosts ? (
        // Loading skeleton
        [1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton variant="card" className="h-48" />
            </CardHeader>
            <CardContent>
              <SkeletonGroup>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <div className="flex gap-2">
                  <Skeleton variant="circle" className="w-6 h-6" />
                  <Skeleton variant="text" width="30%" />
                </div>
              </SkeletonGroup>
            </CardContent>
          </Card>
        ))
      ) : filteredPosts?.length > 0 ? (
        filteredPosts.map((post) => (
          <BlogCard 
            key={post.id} 
            post={post} 
            onDelete={handleDeletePost} 
          />
        ))
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-medium text-muted-foreground">
                No posts for this date
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Update PaginationControls to handle week changes
  const PaginationControls = () => {
    const handleWeekChange = (newWeek) => {
      setSelectedDate(null);
      setCurrentWeek(newWeek);
    };

    return (
      <div className="flex justify-start gap-4 mt-8">
        <Button
          variant="outline"
          disabled={currentWeek === 0}
          onClick={() => handleWeekChange(currentWeek - 1)}
        >
          Previous Week
        </Button>
        <Button
          variant="outline"
          disabled={currentWeek >= weeklyPosts.length - 1}
          onClick={() => handleWeekChange(currentWeek + 1)}
        >
          Next Week
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Head>
        <title>Joshua Solomon | OJT Development Journey</title>
        <meta name="description" content="Follow my daily journey as a Junior Developer during my On-the-Job Training" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-white dark:text-blue-100">Dev Journey</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SignedIn>
                <Button 
                  variant="secondary" 
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="secondary">Sign In</Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-bold text-white dark:text-blue-100 mb-2">Joshua Ralph Adrian Solomon</h2>
              <p className="text-xl text-blue-100 dark:text-blue-200 mb-4">Junior Developer | PasuyoPH</p>
              <p className="text-blue-100 dark:text-blue-200 max-w-xl">
                Follow my daily development journey during my On-the-Job Training from February 5 to April 15, 2025.
              </p>
            </div>
            
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400">JS</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* OJT Progress Summary */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle>OJT Progress Overview</CardTitle>
            <CardDescription>Tracking my hours at PasuyoPH OJT Program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 dark:text-blue-200 mb-2">Hours Completed</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{hoursCompleted}</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 dark:text-amber-200 mb-2">Hours Remaining</h3>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{hoursRemaining}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 dark:text-green-200 mb-2">Total Required</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totalRequiredHours}</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{completionPercentage}% Complete</span>
                <span className="text-sm text-gray-500">{hoursCompleted}/{totalRequiredHours} hours</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Blog Entries</h2>
              <SignedIn>
                {user?.id === process.env.NEXT_PUBLIC_AUTHOR_USER_ID && (
                  <Button 
                    variant="secondary" 
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                    onClick={() => window.location.href = '/blog/new'}
                  >
                    Create New Entry
                  </Button>
                )}
              </SignedIn>
            </div>
            
            {weeklyPosts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold">
                  {selectedDate ? (
                    `Posts for ${format(selectedDate, 'MMM d, yyyy')}`
                  ) : (
                    `Week ${currentWeek + 1} (
                      ${format(weeklyPosts[currentWeek].startDate, 'MMM d')} - 
                      ${format(new Date(weeklyPosts[currentWeek].startDate).setDate(
                        weeklyPosts[currentWeek].startDate.getDate() + 6
                      ), 'MMM d')}
                    )`
                  )}
                </h3>
              </div>
            )}

            {renderPosts()}
            <PaginationControls />
            
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Scheduled Posts</h2>
            <div className="space-y-6">
              {scheduledPosts.map(post => (
                <Card key={post.id} className="bg-yellow-50 dark:bg-yellow-900/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{post.title}</CardTitle>
                      <div className="text-right">
                        <p className="text-sm text-yellow-600 dark:text-yellow-300 mb-1">
                          Scheduled: {format(new Date(post.publish_date), 'MMM d, yyyy')}
                        </p>
                        <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-800">
                          {post.hours} hours
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{post.excerpt || 'No excerpt available'}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                      {post.tags?.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/blog/${post.id}`)}
                    >
                      Read More
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {scheduledPosts.length === 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-lg font-medium text-muted-foreground">
                        No scheduled posts
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">JS</span>
                  </div>
                  <h3 className="font-bold text-xl">Joshua Solomon</h3>
                  <p className="text-gray-500">Junior Developer</p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <p><span className="font-medium">School:</span> Gordon College</p>
                  <p><span className="font-medium">Program:</span> BS Computer Science</p>
                  <p><span className="font-medium">OJT Period:</span> Feb 5 - Apr 15, 2025</p>
                  <p><span className="font-medium">OJT Requirement:</span> {totalRequiredHours} hours</p>
                  <p><span className="font-medium">Focus:</span> Software Development</p>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h4 className="font-medium mb-2 dark:text-gray-100">School Information</h4>
                  <div className="text-sm space-y-1 text-gray-700 dark:text-white">
                    <p>Gordon College</p>
                    <p>Olongapo City, Zambales</p>
                    <p>Department of Computer Studies</p>
                    <p>OJT Advisor. Loudel Manaloto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            
            <CalendarComponent 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              startDate={startDate}
              endDate={endDate}
              posts={posts}
              weeklyHours={weeklyHours}
            />
              
          </div>
        </div>

        
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-2">Joshua Solomon</h3>
              <p className="text-gray-300">Junior Developer | Gordon College</p>
              <p className="text-gray-400 mt-2">OJT Progress: {completionPercentage}% Complete</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">School Information</h3>
              <p className="text-gray-300">Gordon College</p>
              <p className="text-gray-400">Computer Science Department</p>
              <p className="text-gray-400">Olongapo City, Zambales</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">OJT Details</h3>
              <p className="text-gray-300">
                Required Hours: {totalRequiredHours}
              </p>
              <p className="text-gray-300">
                Completed: {hoursCompleted} | Remaining: {hoursRemaining}
              </p>
              <p className="text-gray-400 mt-2">© 2025 Joshua Solomon</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}