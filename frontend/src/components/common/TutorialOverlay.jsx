import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Joyride, STATUS } from 'react-joyride';

const STUDENT_TOUR_STEPS = [
  { 
    target: '.tour-announcements',
    content: 'Theo dõi lịch học, lịch kiểm tra và tin tức từ giáo viên qua bảng thông báo.',
    title: 'Xem thông báo',
    disableBeacon: true,
  },
  { 
    target: '.tour-documents',
    content: 'Truy cập kho tài liệu đa dạng: PDF, slide, video bài giảng được phân loại rõ ràng.',
    title: 'Tìm tài liệu học',
    disableBeacon: true,
  },
  { 
    target: '.tour-ai-chat',
    content: 'Chat với AI để được hỗ trợ học tập 24/7. AI sẽ hướng dẫn bạn tư duy, không chỉ đưa đáp án.',
    title: 'Sử dụng AI Trợ Lý',
    disableBeacon: true,
  },
  { 
    target: '.tour-exams',
    content: 'Tham gia kiểm tra trực tuyến và xem kết quả ngay sau khi nộp bài.',
    title: 'Làm bài kiểm tra',
    disableBeacon: true,
  },
];

const TEACHER_TOUR_STEPS = [
  { 
    target: '.tour-classes',
    content: 'Quản lý danh sách các lớp học, thêm học sinh và theo dõi tiến độ của lớp.',
    title: 'Quản lý Lớp học',
    disableBeacon: true,
  },
  { 
    target: '.tour-documents',
    content: 'Đăng tải và chia sẻ tài liệu bài giảng cho học sinh một cách dễ dàng.',
    title: 'Quản lý Tài liệu',
    disableBeacon: true,
  },
  { 
    target: '.tour-exams',
    content: 'Tạo bài kiểm tra trực tuyến, thiết lập câu hỏi và tự động chấm điểm.',
    title: 'Tạo Bài kiểm tra',
    disableBeacon: true,
  },
  { 
    target: '.tour-announcements',
    content: 'Gửi thông báo nhanh chóng đến toàn thể học sinh hoặc từng lớp cụ thể.',
    title: 'Gửi Thông báo',
    disableBeacon: true,
  },
];

export default function TutorialOverlay() {
  const { user, markTutorialDone } = useAuth();
  const [run, setRun] = useState(true);

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      await markTutorialDone();
    }
  };

  const steps = user?.role === 'teacher' ? TEACHER_TOUR_STEPS : STUDENT_TOUR_STEPS;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#10b981',
          textColor: '#334155',
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonNext: {
          backgroundColor: '#10b981'
        },
        buttonBack: {
          marginRight: 10
        }
      }}
      locale={{
        back: 'Quay lại',
        close: 'Đóng',
        last: '🎉 Bắt đầu học!',
        next: 'Tiếp theo',
        skip: 'Bỏ qua hướng dẫn'
      }}
    />
  );
}
