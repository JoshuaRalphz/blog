import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Clock, CalendarDays, Filter, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';

export default function CalendarComponent({ 
  selectedDate, 
  setSelectedDate, 
  startDate, 
  endDate, 
  posts,
  weeklyHours
}) {
  const { user } = useUser();
  const today = new Date();
  
  // Check if user is authorized to view future posts
  const canViewFuturePosts = user?.id === process.env.NEXT_PUBLIC_AUTHOR_USER_ID;

  // Group posts by date for easier lookup
  const postsByDate = {};
  posts
    .filter(post => {
      const postDate = new Date(post.publish_date);
      const isFuture = postDate > new Date();
      
      // Include posts based on user permissions
      return (post.status === 'published' || 
             (post.status === 'scheduled' && 
              (!isFuture || canViewFuturePosts)));
    })
    .forEach(post => {
      const dateStr = new Date(post.publish_date).toDateString();
      if (!postsByDate[dateStr]) {
        postsByDate[dateStr] = [];
      }
      postsByDate[dateStr].push(post);
    });
  
  // Get posts for selected date
  const selectedDatePosts = selectedDate 
    ? (postsByDate[selectedDate.toDateString()] || []) 
    : [];
  
  // Get dates with the most posts
  const getTopPostDates = () => {
    const dates = Object.entries(postsByDate)
      .map(([dateStr, posts]) => ({ 
        date: new Date(dateStr), 
        count: posts.length 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    return dates;
  };
  
  const topPostDates = getTopPostDates();
  
  // Function to render tags for posts
  const renderPostTags = (post) => {
    if (!post.tags || !post.tags.length) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {post.tags.slice(0, 3).map((tag, i) => (
          <Badge key={i} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {post.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{post.tags.length - 3}
          </Badge>
        )}
      </div>
    );
  };
  
  // Function to calculate month activity
  const getMonthActivity = () => {
    const now = new Date();
    const monthsActivity = [];
    
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), i, 1);
      const monthPosts = posts.filter(post => {
        const postDate = new Date(post.publish_date);
        const isFuture = postDate > new Date();
        
        return (post.status === 'published' || 
               (post.status === 'scheduled' && !isFuture)) &&
               postDate.getMonth() === i && 
               postDate.getFullYear() === now.getFullYear();
      });
      
      monthsActivity.push({
        month,
        postCount: monthPosts.length,
        label: format(month, 'MMM')
      });
    }
    
    return monthsActivity;
  };
  
  const monthsActivity = getMonthActivity();
  const currentMonth = today.getMonth();
  
  // Function to get heat level class based on post count
  const getHeatClass = (count) => {
    return count > 0 ? "bg-indigo-500 dark:bg-indigo-500" : "bg-gray-100 dark:bg-gray-800";
  };
  
  // Add this helper function to get current week index
  const getCurrentWeekIndex = () => {
    const today = new Date();
    // Find the week that contains today's date
    const index = weeklyHours.findIndex(week => {
      const weekStart = new Date(week.startDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return today >= weekStart && today <= weekEnd;
    });
    
    // If no week found, default to the first week
    return index !== -1 ? index : 0;
  };
  
  const handleBackToDefault = () => {
    setSelectedDate(new Date()); // Set to current date
    setCurrentWeek(getCurrentWeekIndex()); // Set to current week
  };
  
  // Add this helper function to check if current view is today
  const isViewingToday = () => {
    const today = new Date();
    if (selectedDate) {
      return selectedDate.toDateString() === today.toDateString();
    }
    const currentWeek = weeklyHours[getCurrentWeekIndex()];
    return (
      currentWeek.startDate <= today &&
      new Date(currentWeek.startDate).setDate(currentWeek.startDate.getDate() + 6) >= today
    );
  };
  
  return (
    <Card className="w-full shadow-lg border-0 dark:border dark:border-gray-800 mt-6">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-900 text-white ">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl py-2">Blog Calendar</CardTitle>
            <CardDescription className="text-indigo-100 dark:text-indigo-200 pb-2">
              Track your publishing history
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400">
            {posts.length} Total Posts
          </Badge>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="calendar" className="w-full">
      <TabsList className="grid grid-cols-3 w-fit mx-auto mt-2 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            <BarChart className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar">
          <CardContent className="pt-6 px-6 py-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => 
                date < startDate || 
                date > endDate || 
                (date > new Date() && !canViewFuturePosts)
              }
              className="rounded-lg border border-gray-200 dark:border-gray-800 justify-items-center w-full mx-auto h-102 shadow-sm"
              classNames={{
                head_cell: "text-gray-500 dark:text-gray-400 rounded-md w-11 font-medium text-[0.8rem]",
                cell: cn(
                  "h-11 w-11 text-center text-sm p-0 relative",
                  "[&:has([aria-selected])]:bg-emerald-50 dark:[&:has([aria-selected])]:bg-emerald-900/20",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                  "[&:has([aria-selected].day-range-start)]:rounded-l-md",
                  "first:[&:has([aria-selected])]:rounded-l-md",
                  "last:[&:has([aria-selected])]:rounded-r-md",
                  "focus-within:relative focus-within:z-20"
                ),
                day: cn(
                  "h-11 w-11 p-0 font-medium aria-selected:opacity-100",
                  "hover:bg-emerald-50 dark:hover:bg-emerald-900/50",
                  "text-base transition-colors duration-200",
                  "text-gray-900 dark:text-gray-100"
                ),
                day_selected: cn(
                  "bg-emerald-600 text-white",
                  "hover:bg-emerald-700 hover:text-white",
                  "focus:bg-emerald-600 focus:text-white",
                  "dark:bg-emerald-700 dark:hover:bg-emerald-600"
                ),
                day_today: cn(
                  "bg-emerald-100 dark:bg-emerald-900/30",
                  "text-emerald-700 dark:text-emerald-300",
                  "border-2 border-emerald-500 dark:border-emerald-700",
                  "font-semibold"
                ),
                day_outside: cn(
                  "text-gray-400 dark:text-gray-500",
                  "aria-selected:text-gray-400 dark:aria-selected:text-gray-500"
                ),
                day_disabled: cn(
                  "text-gray-300 dark:text-gray-600",
                  "opacity-50"
                ),
              }}
              components={{
                DayContent: (props) => {
                  const date = props.date;
                  const dateStr = date.toDateString();
                  const posts = postsByDate[dateStr] || [];
                  const postCount = posts.length;
                  const isCurrentMonth = isSameMonth(date, props.displayMonth);
                  const hasScheduled = posts.some(post => post.status === 'scheduled');
                  
                  return (
                    <div 
                      className={`w-full h-full relative flex items-center justify-center 
                        ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <div 
                        className={`absolute inset-1 rounded-full 
                          ${getHeatClass(postCount)} 
                          transition-all duration-200 
                          ${selectedDate && isSameDay(date, selectedDate) ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}
                          ${hasScheduled ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}`}
                      ></div>
                      <span className={`z-10 relative text-sm font-medium 
                        ${postCount > 0 ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                        {date.getDate()}
                      </span>
                      {postCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 dark:bg-purple-500 text-white text-xs 
                          rounded-full h-4 w-4 flex items-center justify-center z-20">
                          {postCount}
                        </span>
                      )}
                    </div>
                  );
                }
              }}
            />
            
            {selectedDate && selectedDatePosts.length > 0 && (
              <div className="mt-6 border-t pt-4 dark:border-gray-800">
                <h3 className="text-sm font-medium mb-2 flex items-center dark:text-gray-200">
                  <Filter className="h-4 w-4 mr-1" />
                  {format(selectedDate, 'MMMM d, yyyy')} 
                </h3>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {selectedDatePosts.map((post, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                      <div className="font-medium text-sm dark:text-gray-200">{post.title}</div>
                      {renderPostTags(post)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="timeline">
          <CardContent>
            <div className="space-y-4">
              {Object.entries(postsByDate)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .slice(0, 5)
                .map(([dateStr, posts]) => (
                  <div key={dateStr} className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-800">
                    <div className="absolute top-0 left-0 w-4 h-4 -ml-2 rounded-full bg-indigo-400 dark:bg-indigo-600"></div>
                    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-300 mb-1">
                      {format(new Date(dateStr), 'MMMM d, yyyy')}
                    </div>
                    <div className="space-y-2">
                      {posts.map((post, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                          <div className="font-medium text-sm dark:text-gray-200">{post.title}</div>
                          {renderPostTags(post)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="insights">
          <CardContent>
            {/* Weekly Hours Card Integration */}
 
              <CardHeader className="py-6">
                <CardTitle className="text-base">Weekly Hours</CardTitle>
                <CardDescription>Hours logged by week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyHours.map((week, index) => {
                    const weekNumber = index + 1;
                    const weekRange = `${format(week.startDate, 'MMM d')} - ${format(
                      new Date(week.startDate.getFullYear(), week.startDate.getMonth(), week.startDate.getDate() + 6),
                      'MMM d'
                    )}`;
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm dark:text-gray-300">Week {weekNumber} ({weekRange})</span>
                          <span className="text-sm font-medium dark:text-gray-200">{week.totalHours} hours</span>
                        </div>
                        <Progress 
                          value={(week.totalHours / 40) * 100} 
                          className="h-2 dark:bg-gray-700" 
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>


          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-center p-4 pt-2">
        <Button
          variant="outline"
          onClick={handleBackToDefault}
          className="flex items-center gap-1"
          disabled={isViewingToday()}
        >
          <Home className="h-4 w-4" />
          Back to Today
        </Button>
      </CardFooter>
    </Card>
  );
}