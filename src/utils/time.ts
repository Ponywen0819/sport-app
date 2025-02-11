// 獲取日期格式化器
export function getDateFormatter(
    locale: string = 'zh-TW',
    timeZone: string = 'Asia/Taipei',
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }
): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(locale, {
        timeZone,
        ...options
    });
}

// 獲取當前日期並轉換為指定時區
export function getCurrentDate(timeZone: string = 'Asia/Taipei'): Date {
    // 使用 Intl.DateTimeFormat 來處理時區轉換
    const formatter = getDateFormatter('en-US', timeZone)

    // 將格式化後的日期字串轉換回 Date 物件
    const parts = formatter.formatToParts(new Date());
    const dateObj = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

    return new Date(
        `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`,
    );
}


// 獲取格式化後的日期字串
export function getFormattedDate(
    date: Date,
    locale: string = 'zh-TW',
    timeZone: string = 'Asia/Taipei'
): string {
    return getDateFormatter(locale, timeZone).format(date);
}

// 獲取當前日期字串（簡化版）
export function getCurrentDateString(): string {
    return getFormattedDate(new Date());
}

/**
 * 獲取指定年份與月份的第一天是星期幾
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 星期幾 (0-6, 0=星期日, 1=星期一, ..., 6=星期六)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
    // 創建指定年份和月份的日期物件
    // 注意：JavaScript 的月份是從 0 開始的，所以要減 1
    const date = new Date(year, month, 1);

    // 使用 getDay() 方法獲取星期幾
    return date.getDay();
}

/**
 * 獲取當前月份的天數
 * @param year 年份
 * @param month 月份 (0-11)
 * @returns 該月份的天數
 */
export function getDaysInMonth(year: number, month: number): number {
    const formattedMonthIndex = (month + 1) % 11
    return new Date(year, formattedMonthIndex, 0).getDate();
}

/**
 * 將月份數字轉換為英文縮寫
 * @param month 月份 (0-11)
 * @returns 月份的英文縮寫 (Jan, Feb, Mar, ...)
 */
export function getMonthAbbreviation(month: number): string {
    const monthAbbreviations = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'May', 'Jun', 'Jul', 'Aug',
        'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // 確保月份在有效範圍內
    if (month < 0 || month > 11) {
        throw new Error('月份必須在0到11之間');
    }

    return monthAbbreviations[month];
}
