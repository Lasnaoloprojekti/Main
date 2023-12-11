import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AttendanceDataModification = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [students, setStudents] = useState([]);
    const userId = localStorage.getItem('userid');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [attendances, setAttendances] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleAttendanceStatusUpdate = async (attendanceId, newStatus) => {
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await axios.post(`http://localhost:3001/api/updateattendancestatus`, {
                attendanceId: attendanceId,
                newStatus: newStatus
            });

            if (response.status === 200) {
                setSuccessMessage('Attendance status updated successfully.');
                // Re-fetch the attendances to reflect the changes
                handleStudentChange({ target: { value: selectedStudent } });
            }
        } catch (error) {
            console.error('Error updating attendance status:', error);
            setErrorMessage('Failed to update attendance status. Please try again.');
        }
    };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('http://localhost:3001/selectactivecourse', { headers: { userid: userId } });
                console.log('Courses fetched:', response);
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        fetchCourses();
    }, []);

    const handleCourseChange = async (e) => {
        const courseId = e.target.value;
        setSelectedCourse(courseId);
        setAttendances([]); // Reset attendances when course changes
        setSelectedStudent(''); // Reset selected student

        try {
            const response = await axios.get(`http://localhost:3001/api/coursestudents/${courseId}`);
            console.log('Students fetched:', response.data); // Debugging line
            setStudents(response.data.students); // Assuming the response has a students field
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };


    const handleStudentChange = async (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);

        if (!selectedCourse) return; // Ensure that a course is selected
        console.log('Selected student inside handleStudentChange function:', studentId);

        try {
            const response = await axios.get(`http://localhost:3001/api/studentattendance/${studentId}/${selectedCourse}`);
            // Filter attendances to include only those that belong to the selected course
            const filteredAttendances = response.data.attendances.filter(attendance => attendance.course === selectedCourse);
            setAttendances(filteredAttendances);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        }
    };


    const formatDate = (dateString) => {
        return dateString.slice(0, 10); // This will return only the first 10 characters of the date string (YYYY-MM-DD)
    };


    return (
        <div className="min-h-screen w-full flex flex-col items-center px-6 py-10">
            <div className="max-w-4xl w-full bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
                <div className="text-center text-xl mb-4 font-roboto-slab">
                    Modify Attendance Data
                </div>
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
                        Select Course
                    </label>
                    <select
                        className="border border-gray-300 p-3 rounded-lg block w-full mb-4 font-open-sans"
                        value={selectedCourse}
                        onChange={handleCourseChange}>
                        <option value="">Select Course</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.name + ' / ' + course.groupName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
                        Select Student
                    </label>
                    <select
                        className="border border-gray-300 p-3 rounded-lg block w-full mb-4 font-open-sans"
                        value={selectedStudent}
                        onChange={handleStudentChange}>
                        <option value="">Select Student</option>
                        {students.map(student => (
                            <option key={student._id} value={student._id}>
                                {student.firstName + ' ' + student.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedStudent && attendances.length > 0 ? (

                    <div>
                        <h2 className="text-lg font-roboto-slab my-4">Attendances:</h2>
                        <table className="w-full text-sm text-left text-gray-500 font-roboto-slab">
                            <thead className="text-xs text-white uppercase bg-blue-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Time of Day</th>
                                    <th scope="col" className="px-6 py-3">Topic</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendances.map(attendance => (
                                    <tr key={attendance._id} className="bg-white border-b font-open-sans">
                                        <td className="px-6 py-4">{formatDate(attendance.date)}</td>
                                        <td className="px-6 py-4">{attendance.timeOfDay}</td>
                                        <td className="px-6 py-4">{attendance.topic}</td>
                                        <td className="px-6 py-4">{attendance.status}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                onChange={(e) => handleAttendanceStatusUpdate(attendance._id, e.target.value)}
                                                defaultValue={attendance.status}
                                                className="border font-open-sans border-gray-300 p-2 rounded">
                                                <option value="Present">Present</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Accept absence">Accept absence</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : selectedStudent && (
                    <div className="text-center text-lg mt-4 font-roboto-slab text-gray-600">
                        No attendance records yet.
                    </div>
                )}
                {successMessage && (
                    <div className="text-green-600 mt-4">{successMessage}</div>
                )}
                {errorMessage && (
                    <div className="text-red-600 mt-4">{errorMessage}</div>
                )}
            </div>
        </div>
    );
};

export default AttendanceDataModification;