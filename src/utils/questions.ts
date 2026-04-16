import { Question } from '../types';

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: '1',
    content: 'Năng lượng không tự sinh ra và không tự mất đi, nó chỉ chuyển hóa từ dạng này sang dạng khác.',
    isCorrect: true,
    explanation: 'Đây là định luật bảo toàn năng lượng cơ bản trong vật lý.',
    difficulty: 'Easy'
  },
  {
    id: '2',
    content: 'Điện năng không thể chuyển hóa thành nhiệt năng.',
    isCorrect: false,
    explanation: 'Điện năng có thể chuyển hóa thành nhiệt năng (ví dụ: bàn là, ấm điện).',
    difficulty: 'Easy'
  },
  {
    id: '3',
    content: 'Gió mang năng lượng dưới dạng động năng giúp làm quay các cánh quạt của tuabin gió.',
    isCorrect: true,
    explanation: 'Sự chuyển động của không khí tạo ra động năng, được tuabin chuyển hóa thành điện năng.',
    difficulty: 'Easy'
  },
  {
    id: '4',
    content: 'Quang năng từ Mặt Trời có thể chuyển hóa thành điện năng thông qua pin mặt trời.',
    isCorrect: true,
    explanation: 'Pin mặt trời (tế bào quang điện) biến đổi trực tiếp ánh sáng thành điện năng.',
    difficulty: 'Easy'
  },
  {
    id: '5',
    content: 'Khi một vật rơi từ trên cao xuống, thế năng của nó tăng dần.',
    isCorrect: false,
    explanation: 'Khi rơi xuống, độ cao giảm nên thế năng giảm, chuyển hóa thành động năng.',
    difficulty: 'Easy'
  },
  {
    id: '6',
    content: 'Trong nhà máy thủy điện, thế năng của nước ở trên cao được chuyển hóa thành điện năng.',
    isCorrect: true,
    explanation: 'Nước từ trên cao chảy xuống (thế năng -> động năng) làm quay tuabin để phát điện.',
    difficulty: 'Easy'
  },
  {
    id: '7',
    content: 'Năng lượng hóa học trong thức ăn giúp con người có thể vận động và duy trì thân nhiệt.',
    isCorrect: true,
    explanation: 'Thức ăn cung cấp năng lượng hóa học, chuyển hóa thành cơ năng (vận động) và nhiệt năng (thân nhiệt).',
    difficulty: 'Easy'
  },
  {
    id: '8',
    content: 'Âm thanh không mang năng lượng vì chúng ta không thể nhìn thấy hoặc cầm nắm được nó.',
    isCorrect: false,
    explanation: 'Âm thanh là một dạng năng lượng (năng lượng âm thanh) lan truyền dưới dạng sóng.',
    difficulty: 'Easy'
  },
  {
    id: '9',
    content: 'Khi sử dụng máy sấy tóc, điện năng chỉ chuyển hóa duy nhất thành nhiệt năng.',
    isCorrect: false,
    explanation: 'Điện năng còn chuyển hóa thành cơ năng (làm quay quạt) và năng lượng âm thanh.',
    difficulty: 'Easy'
  },
  {
    id: '10',
    content: 'Năng lượng tái tạo (như gió, mặt trời) là nguồn năng lượng sẽ bị cạn kiệt nếu chúng ta sử dụng quá nhiều.',
    isCorrect: false,
    explanation: 'Năng lượng tái tạo là nguồn năng lượng vô tận hoặc có thể tự phục hồi trong thời gian ngắn.',
    difficulty: 'Easy'
  }
];
