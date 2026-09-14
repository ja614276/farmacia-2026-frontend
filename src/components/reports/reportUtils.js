/**
 * Utilidades compartidas para reportes gerenciales
 */

export const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    try {
        const cleanStr = String(dateStr).replace(" ", "T");
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleString("es-PE", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return String(dateStr);
    }
};

export const formatDateOnly = (dateStr) => {
    if (!dateStr) return "—";
    try {
        const cleanStr = String(dateStr).replace(" ", "T");
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return String(dateStr);
    }
};

export const isDateInFilter = (dateStr, filterKey, startDate, endDate) => {
    if (!dateStr || filterKey === "all") return true;
    const cleanStr = String(dateStr).replace(" ", "T");
    const itemDate = new Date(cleanStr);
    if (isNaN(itemDate.getTime())) return true;

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (filterKey === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return itemDate >= todayStart && itemDate <= now;
    }
    if (filterKey === "7") {
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
    }
    if (filterKey === "15") {
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 15;
    }
    if (filterKey === "30") {
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 30;
    }
    if (filterKey === "month") {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (filterKey === "custom") {
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate + "T23:59:59")) return false;
        return true;
    }
    return true;
};

export const downloadCSV = (filename, headers, rows) => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.join(";") + "\n";
    rows.forEach(row => {
        csvContent += row.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
