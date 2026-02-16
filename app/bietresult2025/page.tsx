"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Result {
    rollNo: string;
    name: string | null;
    sgpa: string | null;
    success: boolean;
    error?: string;
}

interface ApiResponse {
    success: boolean;
    total: number;
    results: Result[];
    summary: {
        processed: number;
        withResults: number;
        failed: number;
    };
}

export default function BIETResult() {
    const [startRoll, setStartRoll] = useState("2400430400001");
    const [endRoll, setEndRoll] = useState("2400430400056");
    const [semester, setSemester] = useState("1");
    const [session, setSession] = useState("13"); // 2024-25
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ApiResponse | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const fetchResults = async () => {
        setLoading(true);
        setData(null);
        setResults([]);
        try {
            const response = await fetch(
                `/api/bietresult2025?start=${startRoll}&end=${endRoll}&semester=${semester}&session=${session}`
            );
            const jsonData = await response.json();
            setData(jsonData);
            if (jsonData.results) {
                // Initial sort: High SGPA to Low
                const sorted = [...jsonData.results].sort((a, b) => {
                    const sgpaA = parseFloat(a.sgpa || "0");
                    const sgpaB = parseFloat(b.sgpa || "0");
                    return sgpaB - sgpaA;
                });
                setResults(sorted);
            }
            console.log(jsonData);
        } catch (error) {
            console.error("Error fetching results:", error);
            alert("Failed to fetch results");
        } finally {
            setLoading(false);
        }
    };

    const handleSort = () => {
        const newOrder = sortOrder === "desc" ? "asc" : "desc";
        setSortOrder(newOrder);
        const sorted = [...results].sort((a, b) => {
            const sgpaA = parseFloat(a.sgpa || "0");
            const sgpaB = parseFloat(b.sgpa || "0");
            return newOrder === "desc" ? sgpaB - sgpaA : sgpaA - sgpaB;
        });
        setResults(sorted);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text("BIET Jhansi Result Analysis", 14, 20);

        // Metadata
        doc.setFontSize(10);
        doc.text(`Session: ${session === "13" ? "2024-25" : session}`, 14, 30);
        doc.text(`Semester: ${semester}`, 14, 35);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

        // Summary
        if (data?.summary) {
            doc.text(`Total Processed: ${data.summary.processed}`, 14, 50);
            doc.text(`Passed/Found: ${data.summary.withResults}`, 60, 50);
            doc.text(`Failed/Not Found: ${data.summary.failed}`, 110, 50);
        }

        // Table
        const tableColumn = ["#", "Roll Number", "SGPA", "Status"];
        const tableRows = results.map((result, index) => [
            index + 1,
            result.rollNo,
            result.sgpa || "-",
            result.success ? "Found" : "Not Found/Error"
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: "striped",
            headStyles: { fillColor: [66, 66, 66] },
        });

        doc.save("biet-results.pdf");
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 dark:bg-gray-950">
            <div className="mx-auto max-w-5xl space-y-8">

                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        BIET Result Scraper
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Fetch, analyze, and download student results in bulk.
                    </p>
                </div>

                {/* Configuration Card */}
                <Card className="border-none shadow-md ring-1 ring-gray-900/5 dark:ring-white/10">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Enter the roll number range and session details.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="startRoll">Starting Roll No</Label>
                            <Input
                                id="startRoll"
                                value={startRoll}
                                onChange={(e) => setStartRoll(e.target.value)}
                                placeholder="2400430400001"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endRoll">Ending Roll No</Label>
                            <Input
                                id="endRoll"
                                value={endRoll}
                                onChange={(e) => setEndRoll(e.target.value)}
                                placeholder="2400430400056"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="session">Session</Label>
                            <select
                                id="session"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={session}
                                onChange={(e) => setSession(e.target.value)}
                            >
                                <option value="14">2025-26</option>
                                <option value="13">2024-25</option>
                                <option value="12">2023-24</option>
                                <option value="11">2022-23</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="semester">Semester</Label>
                            <select
                                id="semester"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                            >
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                            <Button
                                onClick={fetchResults}
                                disabled={loading}
                                className="w-full md:w-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Fetching Results...
                                    </>
                                ) : (
                                    "Fetch Results"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Section */}
                {results.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data?.summary.processed}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-600">Found</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{data?.summary.withResults}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-red-600">Failed / Not Found</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">{data?.summary.failed}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm ring-1 ring-gray-900/5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold">Results Table</h2>
                                <span className="text-sm text-gray-500">({results.length} records)</span>
                            </div>
                            <Button variant="outline" onClick={downloadPDF} className="gap-2">
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>

                        {/* Table */}
                        <div className="rounded-lg border bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">#</th>
                                            <th className="px-6 py-3 font-medium">Roll Number</th>
                                            <th className="px-6 py-3 font-medium">Name</th>
                                            <th
                                                className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                                onClick={handleSort}
                                            >
                                                SGPA
                                                {sortOrder === "desc" ? "↓" : "↑"}
                                            </th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {results.map((result, index) => (
                                            <tr
                                                key={result.rollNo}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium">{index + 1}</td>
                                                <td className="px-6 py-4">{result.rollNo}</td>
                                                <td className="px-6 py-4">{result.name}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                    {result.sgpa || "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${result.success
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                            }`}
                                                    >
                                                        {result.success ? "Success" : "Failed"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {results.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No results found to display.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
