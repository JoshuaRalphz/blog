export default function ProgressSummary({ hoursCompleted, hoursRemaining, completionPercentage }) {
  return (
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
  );
} 