import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const createStudentPDFDoc = (student, registrations, schedules) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Student Record', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

  // Profile Picture (if exists)
  if (student.profilePicture) {
     try {
        // Add image: (imageData, format, x, y, width, height)
        // Adjust coordinates and size as needed
        doc.addImage(student.profilePicture, 'JPEG', pageWidth - 45, 15, 30, 30);
     } catch (err) {
        console.error("Failed to add profile picture to PDF", err);
     }
  }

  // Personal Information
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Personal Information', 14, 45);

  const personalData = [
    ['Full Name', `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`],
    ['Email', student.email],
    ['Mobile No.', student.mobileNo || '-'],
    ['Telephone No.', student.telephoneNo || '-'],
    ['Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'],
    ['Age', student.age || '-'],
    ['Sex', student.sex || '-'],
    ['Civil Status', student.civilStatus || '-'],
    ['Nationality', student.nationality || '-'],
    ['Religion', student.religion || '-'],
    ['Address', student.completeAddress || '-']
  ];

  autoTable(doc, {
    startY: 50,
    head: [],
    body: personalData,
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  // Education & Employment
  let finalY = doc.lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(14);
  doc.text('Education & Employment', 14, finalY);

  const educationEmploymentData = [
    ['College/University', student.educationCollege || '-'],
    ['Course', student.educationCourse || '-'],
    ['Company', student.employmentCompany || '-'],
    ['Position', student.employmentPosition || '-'],
    ['Department', student.employmentDepartment || '-'],
    ['Employment Status', student.employmentStatus || '-'],
    ['Date Hired', student.employmentDate ? new Date(student.employmentDate).toLocaleDateString() : '-'],
    ['Years of Experience', student.yearsOfExperience || '-'],
    ['References', student.employmentReferences || '-']
  ];

  autoTable(doc, {
    startY: finalY + 5,
    head: [],
    body: educationEmploymentData,
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  // OJT & Specialization
  finalY = doc.lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(14);
  doc.text('OJT & Specialization', 14, finalY);

  const otherData = [
    ['OJT Industry', student.ojtIndustry || '-'],
    ['OJT Company', student.ojtCompany || '-'],
    ['OJT Address', student.ojtAddress || '-'],
    ['Area of Specialization', student.areaOfSpecialization || '-'],
    ['Other Specification', student.otherSpecification || '-']
  ];

  autoTable(doc, {
    startY: finalY + 5,
    head: [],
    body: otherData,
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  // Registered Courses
  finalY = doc.lastAutoTable.finalY + 15;
  
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(14);
  doc.text('Registered Courses', 14, finalY);

  const studentRegs = registrations.filter(r => (r.studentId?._id || r.studentId) === student._id && r.status !== 'cancelled');
  const regData = studentRegs.map(reg => {
    const schedId = reg.scheduleId?._id || reg.scheduleId;
    const schedule = schedules.find(s => s._id === schedId);
    return [
      schedule ? (schedule.courseTitle || schedule.title) : 'Unknown Course',
      schedule ? new Date(schedule.trainingDate).toLocaleDateString() : '-',
      reg.status || 'Active'
    ];
  });

  if (regData.length > 0) {
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Course Title', 'Training Date', 'Status']],
      body: regData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202] }
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No registered courses found.', 14, finalY + 10);
  }
  
  return doc;
};
