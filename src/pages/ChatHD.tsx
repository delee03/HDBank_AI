import React, { useState, useEffect } from "react";
import {
    Avatar,
    Box,
    Button,
    TextField,
    IconButton,
    Typography,
    CircularProgress,
} from "@mui/material";
import { IoMdSend } from "react-icons/io";
import { VscLoading } from "react-icons/vsc";

// Custom hook useDebounce
function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Chuyển đổi file thành Base64 và loại bỏ phần đầu
function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Chỉ lấy phần dữ liệu Base64, bỏ phần prefix 'data:image/png;base64,'
            const base64String = reader.result as string;
            const base64Data = base64String.split(",")[1]; // Lấy phần sau dấu phẩy
            resolve(base64Data); // Trả về chỉ phần dữ liệu Base64
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

const ChatHD = () => {
    const [textInput, setTextInput] = useState<string>("");
    const [imageInput, setImageInput] = useState<File | null>(null);
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [imageBase64, setImageBase64] = useState<string | null>(null); // Lưu trữ ảnh đã mã hóa
    const debouncedTextInput = useDebounce(textInput, 500); // Delay 500ms cho input

    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextInput(e.target.value);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            setImageInput(file);
        }
    };

    // Handle image delete
    const handleImageDelete = () => {
        setImageInput(null);
        setImageBase64(null); // Xóa ảnh đã tải lên
    };

    const handleSendMessage = async () => {
        if (loading) return;

        setLoading(true);
        const formData = new FormData();

        // Thêm văn bản vào FormData
        if (textInput.trim()) {
            formData.append("user_input", textInput);
        }

        // Nếu có ảnh, chuyển đổi và thêm vào FormData
        if (imageInput) {
            try {
                const base64Data = await toBase64(imageInput); // Mã hóa ảnh thành Base64 và loại bỏ prefix
                formData.append("image", base64Data);
                console.log("Image added to formData", base64Data); // Hiển thị dữ liệu ảnh Base64
            } catch (error) {
                console.error("Error converting image to Base64", error);
            }
        }

        // Gửi dữ liệu tới API
        const API_ENDPOINT = "http://localhost:3000/dev/extract";
        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: imageInput ? await toBase64(imageInput) : null, // Gửi ảnh nếu có
                    user_input: textInput, // Gửi văn bản
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log(result);

                // Lấy trường kb_output từ dữ liệu trả về
                const kbOutput = result.kb_output;

                // Cập nhật phản hồi lên giao diện
                setResponse(JSON.stringify(kbOutput, null, 2));
            } else {
                setResponse("Error: Unable to fetch response.");
            }
        } catch (error) {
            console.error("Error sending request", error);
            setResponse("Error: Failed to send request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ padding: 2, margin: "0 auto", textAlign: "center" }}>
            <Box sx={{ marginBottom: 2, textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontSize: 36 }}>
                    Chat with HD Bank AI
                </Typography>
            </Box>

            {/* <TextField
                label="Enter your question"
                fullWidth
                variant="outlined"
                value={textInput}
                onChange={handleTextInputChange}
                margin="normal"
            /> */}
            <input
                id="userInput"
                placeholder="Ask a question"
                className="bg-white !w-full py-6 px-40 rounded-lg"
                type="text"
                style={{
                    padding: "20px 100px",
                    width: "70%",
                    fontSize: 20,
                    borderRadius: 20,
                }}
                value={textInput}
                onChange={handleTextInputChange}
            />

            {/* Input ảnh */}
            <Box
                sx={{ textAlign: "center", marginBottom: 2, padding: "20px 0" }}
            >
                <Button
                    variant="outlined"
                    component="label"
                    sx={{
                        padding: "10px 20px",
                        borderRadius: "20px",
                        borderColor: "#1976d2",
                        color: "#1976d2",
                        "&:hover": {
                            borderColor: "#115293",
                            color: "#115293",
                        },
                    }}
                >
                    Upload Image
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                </Button>
            </Box>

            {/* Hiển thị tên file ảnh */}
            {imageInput && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingBottom: 4,
                    }}
                >
                    <Typography variant="body2">
                        Selected Image: {imageInput.name}
                    </Typography>
                    <button
                        style={{
                            color: "red",
                            border: "none",
                            marginLeft: "10px",
                            borderRadius: "10px",
                            padding: "10px 14px",
                        }}
                        onClick={() => {
                            setImageInput(null);
                        }}
                    >
                        Xóa
                    </button>
                </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={loading}
                    sx={{ marginRight: 2 }}
                >
                    {loading ? (
                        <CircularProgress
                            size={24}
                            background-color="white"
                            color="success"
                        />
                    ) : (
                        <IoMdSend />
                    )}
                    Send
                </Button>
            </Box>

            {/* Hiển thị phản hồi từ API */}
            {response && (
                <Box
                    sx={{
                        marginTop: 2,
                        padding: 2,
                        borderRadius: 4,
                        color: "black",
                        backgroundColor: "#fff",
                    }}
                >
                    <Typography variant="body2" sx={{ color: "black" }}>
                        HDBank_AI: {response}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ChatHD;
