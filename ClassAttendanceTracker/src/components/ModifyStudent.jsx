import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentModification = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [topics, setTopics] = useState([]);
    const userId = localStorage.getItem('userid');
    const [participatingTopics, setParticipatingTopics] = useState([]);
    const [nonParticipatingTopics, setNonParticipatingTopics] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('http://localhost:3001/selectactivecourse', { headers: { userid: userId } });
                console.log('haetaan kaikki kurssit ', response);
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        fetchCourses();
    }, []);

    const handleCourseChange = async (e) => {
        const courseId = e.target.value;
        setSelectedCourse(courseId); // Reset attendances when course changes
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

        if (!selectedCourse) {
            console.error('No course selected');
            return;
        }

        try {
            // Fetch topics that the student is attending and not attending
            const response = await axios.get(`http://localhost:3001/api/studenttopics/${studentId}/${selectedCourse}`);
            const { courseTopics, attendingTopics } = response.data;

            const nonAttendingTopics = courseTopics.filter(topic => !attendingTopics.includes(topic));

            setParticipatingTopics(attendingTopics);
            setNonParticipatingTopics(nonAttendingTopics);
        } catch (error) {
            console.error('Error fetching topics:', error);
        }
    };


    const handleSubmit = async () => {
        setSuccessMessage(''); // Reset success message
        setErrorMessage(''); // Reset error message

        // Ensure that there is a selected student and course
        if (!selectedCourse || !selectedStudent) {
            setErrorMessage('Please select both a course and a student.');
            console.error('No course or student selected');
            return;
        }

        try {
            // Send the updated list of participating topics to the backend
            await axios.put(`http://localhost:3001/api/updatestudenttopics/${selectedStudent}/${selectedCourse}`, {
                topicsAttending: participatingTopics
            });

            setSuccessMessage('Topics updated successfully!');
        } catch (error) {
            console.error('Error updating student topics:', error);
            setErrorMessage('Failed to update topics. Please try again.');
        }
    };


    const handleTopicClick = (topic, isParticipating) => {
        if (isParticipating) {
            // Remove the topic from participating and add it to non-participating
            setParticipatingTopics(participatingTopics.filter(t => t !== topic));
            setNonParticipatingTopics([...nonParticipatingTopics, topic]);
        } else {
            // Add the topic to participating and remove it from non-participating
            setNonParticipatingTopics(nonParticipatingTopics.filter(t => t !== topic));
            setParticipatingTopics([...participatingTopics, topic]);
        }
    };


    return (
        <div className="min-h-screen w-full flex flex-col items-center px-6 py-10">
            <div className="max-w-4xl w-full bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
                <div className="text-center text-xl mb-4 font-roboto-slab">
                    Modify topics student is attending
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
                {selectedCourse && selectedStudent && (
                    <>
                        <div className="flex gap-6">
                            <div className="w-1/2">
                                <h3 className="font-roboto-slab text-lg mb-2">Topics Attending</h3>
                                <ul className="pl-5 font-open-sans">
                                    {participatingTopics.map(topic => (
                                        <li key={"participating-" + topic} className=" cursor-pointer text-gray-600 hover:text-blue-600" onClick={() => handleTopicClick(topic, true)}>{topic}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="w-1/2">
                                <h3 className="font-roboto-slab text-lg mb-2">Topics Not Attending</h3>
                                <ul className="pl-5 font-open-sans">
                                    {nonParticipatingTopics.map(topic => (
                                        <li key={"non-participating-" + topic} className=" cursor-pointer text-gray-600 hover:text-blue-600" onClick={() => handleTopicClick(topic, false)}>{topic}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <button
                            className="mt-4 bg-blue-800 hover:bg-blue-700 text-white font-open-sans py-2 px-4 rounded"
                            onClick={handleSubmit}
                        >
                            Submit Changes
                        </button>
                    </>
                )}
                {successMessage && <div className="text-green-500">{successMessage}</div>}
                {errorMessage && <div className="text-red-500">{errorMessage}</div>}
            </div>
        </div>
    );
};

export default StudentModification;