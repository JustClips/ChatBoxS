local player = game.Players.LocalPlayer
local TweenService = game:GetService('TweenService')
local UserInputService = game:GetService('UserInputService')

local uiEnabled = true
local minimized = false

local gui = Instance.new('ScreenGui')
gui.Name = 'Eps1llonHub'
gui.ResetOnSpawn = false
gui.Parent = player:WaitForChild('PlayerGui')

-- Main Frame
local mainFrame = Instance.new('Frame', gui)
mainFrame.Size = UDim2.new(0, 650, 0, 300)
mainFrame.Position = UDim2.new(0.5, -325, 0.5, -150)
mainFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
mainFrame.BackgroundTransparency = 0.1
mainFrame.Active = true
mainFrame.Draggable = true
Instance.new('UICorner', mainFrame).CornerRadius = UDim.new(0, 8)

local mainFrameScale = Instance.new("UIScale", mainFrame)
mainFrameScale.Scale = 1

local UIScale = mainFrameScale

local headerFrame = Instance.new('Frame', mainFrame)
headerFrame.Size = UDim2.new(1, 0, 0, 30)
headerFrame.Position = UDim2.new(0, 0, 0, 0)
headerFrame.BackgroundTransparency = 1

local title = Instance.new('TextLabel', headerFrame)
title.Size = UDim2.new(1, -65, 1, 0)
title.Position = UDim2.new(0, 0, 0, 0)
title.Text = 'Eps1llon Hub || Beta'
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.Font = Enum.Font.GothamBold
title.TextSize = 16
title.BackgroundTransparency = 1
title.TextXAlignment = Enum.TextXAlignment.Left

local underline = Instance.new('Frame', mainFrame)
underline.Size = UDim2.new(1, 0, 0, 4)
underline.Position = UDim2.new(0, 0, 0, 30)
underline.BackgroundTransparency = 0
underline.BackgroundColor3 = Color3.fromRGB(31, 81, 138)
underline.BorderSizePixel = 0

-- Minimize Button
local minimize = Instance.new('TextButton', headerFrame)
minimize.Size = UDim2.new(0, 25, 0, 25)
minimize.Position = UDim2.new(1, -50, 0, 2)
minimize.Text = '-'
minimize.Font = Enum.Font.GothamBold
minimize.TextSize = 20
minimize.TextColor3 = Color3.fromRGB(255, 255, 255)
minimize.BackgroundTransparency = 1
minimize.BorderSizePixel = 0

-- Close Button
local close = Instance.new('TextButton', headerFrame)
close.Size = UDim2.new(0, 25, 0, 25)
close.Position = UDim2.new(1, -25, 0, 2)
close.Text = 'X'
close.Font = Enum.Font.GothamBold
close.TextSize = 16
close.TextColor3 = Color3.fromRGB(255, 255, 255)
close.BackgroundTransparency = 1
close.BorderSizePixel = 0
close.MouseButton1Click:Connect(function()
    gui:Destroy()
end)

local sidebar = Instance.new('Frame', mainFrame)
sidebar.Size = UDim2.new(0, 140, 0, 220)
sidebar.Position = UDim2.new(0, 10, 0, 50)
sidebar.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
sidebar.BackgroundTransparency = 0.1
sidebar.BorderSizePixel = 0
Instance.new('UICorner', sidebar).CornerRadius = UDim.new(0, 6)

local outline = Instance.new('UIStroke', sidebar)
outline.Thickness = 2
outline.Color = Color3.fromRGB(31, 81, 138)
outline.ApplyStrokeMode = Enum.ApplyStrokeMode.Border

local highlighter = Instance.new('Frame', sidebar)
highlighter.Size = UDim2.new(1, 0, 0, 30)
highlighter.Position = UDim2.new(0, 0, 0, 10)
highlighter.BackgroundColor3 = Color3.fromRGB(31, 81, 138)
highlighter.BackgroundTransparency = 0.3
highlighter.BorderSizePixel = 0
highlighter.ZIndex = 2
Instance.new('UICorner', highlighter).CornerRadius = UDim.new(1, 999)

local contentFrame = Instance.new('Frame', mainFrame)
contentFrame.Size = UDim2.new(0, 480, 0, 220)
contentFrame.Position = UDim2.new(0, 160, 0, 50)
contentFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
contentFrame.BackgroundTransparency = 0.7
contentFrame.BorderSizePixel = 0
Instance.new('UICorner', contentFrame).CornerRadius = UDim.new(0, 6)

local outlineContentFrame = Instance.new('UIStroke', contentFrame)
outlineContentFrame.Thickness = 2
outlineContentFrame.Color = Color3.fromRGB(31, 81, 138)
outlineContentFrame.ApplyStrokeMode = Enum.ApplyStrokeMode.Border

local function createSection(name)
    local section = Instance.new('Frame')
    section.Name = name
    section.Size = UDim2.new(1, 0, 1, 0)
    section.BackgroundTransparency = 1
    section.Visible = false
    section.Parent = contentFrame
    return section
end

local buttonNames = {
    "Configuration",
    "Combat",
    "ESP",
    "Inventory",
    "Misc",
    "UI Settings",
}

local sectionKeys = {
    Configuration = "Configuration",
    Combat = "Hunt",
    ESP = "ESP",
    Inventory = "Inventory",
    Misc = "Teleports",
    ["UI Settings"] = "UI Settings",
}

local sections = {}
for k, v in pairs(sectionKeys) do
    sections[k] = createSection(k)
end

local sidebarButtons = {}
local DEFAULT_COLOR = Color3.fromRGB(210,210,210)
local ACTIVE_COLOR = Color3.fromRGB(255,255,255)
local DEFAULT_SIZE = 16
local ACTIVE_SIZE = 18

local iconData = {
    Configuration = "134572329997100",
    Combat = "94883448905030",
    ESP = "92313485402528",
    Inventory = "135628846657243",
    Misc = "121583805460244",
    ["UI Settings"] = "93991072023597",
}
local ICON_SIZE = 24
local ICON_LEFT_PAD = 6
local TEXT_LEFT_PAD = ICON_LEFT_PAD + ICON_SIZE + 4

local function setButtonActive(idx)
    for i, group in ipairs(sidebarButtons) do
        local btn = group.TextButton
        local isActive = (i == idx)
        TweenService:Create(btn, TweenInfo.new(0.16, Enum.EasingStyle.Quad), {
            TextSize = isActive and ACTIVE_SIZE or DEFAULT_SIZE,
            TextColor3 = isActive and ACTIVE_COLOR or DEFAULT_COLOR
        }):Play()
        btn.Font = Enum.Font.GothamBold

        if isActive then
            TweenService:Create(highlighter, TweenInfo.new(0.18, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
                Position = group.ButtonFrame.Position,
                Size = group.ButtonFrame.Size,
                BackgroundTransparency = 0.13
            }):Play()
        end
    end
end

local function createSidebarButton(text, yPos, idx)
    local buttonFrame = Instance.new('Frame', sidebar)
    buttonFrame.Size = UDim2.new(1, 0, 0, 30)
    buttonFrame.Position = UDim2.new(0, 0, 0, yPos)
    buttonFrame.BackgroundTransparency = 1
    buttonFrame.ZIndex = 3

    if iconData[text] then
        local image = Instance.new("ImageLabel", buttonFrame)
        image.Size = UDim2.new(0, ICON_SIZE, 0, ICON_SIZE)
        image.Position = UDim2.new(0, ICON_LEFT_PAD, 0.5, -ICON_SIZE/2)
        image.BackgroundTransparency = 1
        image.Image = "rbxassetid://" .. iconData[text]
        image.ImageColor3 = Color3.fromRGB(255,255,255)
        image.ScaleType = Enum.ScaleType.Fit
        image.ZIndex = 4
    end

    local button = Instance.new('TextButton', buttonFrame)
    button.Size = UDim2.new(1, -TEXT_LEFT_PAD, 1, 0)
    button.Position = UDim2.new(0, TEXT_LEFT_PAD, 0, 0)
    button.Text = text
    button.Font = Enum.Font.GothamBold
    button.TextSize = DEFAULT_SIZE
    button.TextColor3 = DEFAULT_COLOR
    button.BackgroundTransparency = 1
    button.TextXAlignment = Enum.TextXAlignment.Left
    button.ZIndex = 5

    button.MouseButton1Click:Connect(function()
        for _, sec in pairs(sections) do sec.Visible = false end
        sections[text].Visible = true
        setButtonActive(idx)
    end)

    sidebarButtons[idx] = { ButtonFrame = buttonFrame, TextButton = button }
    return buttonFrame
end

for i, name in ipairs(buttonNames) do
    createSidebarButton(name, 10 + (i - 1) * 35, i)
end

sections["Configuration"].Visible = true
setButtonActive(1)

-- Minimized floating "ES" circle (grey, smaller text, top-left of GUI)
local minimizedButton = Instance.new('ImageButton')
minimizedButton.Name = "Eps1llonMini"
minimizedButton.Size = UDim2.new(0, 55, 0, 55)
minimizedButton.BackgroundColor3 = Color3.fromRGB(70, 70, 70)
minimizedButton.BackgroundTransparency = 0.08
minimizedButton.AutoButtonColor = true
minimizedButton.Visible = false
minimizedButton.Parent = gui
Instance.new('UICorner', minimizedButton).CornerRadius = UDim.new(1, 999)

-- "ES" text, even smaller
local esText = Instance.new('TextLabel', minimizedButton)
esText.Size = UDim2.new(1, 0, 1, 0)
esText.Position = UDim2.new(0, 0, 0, 0)
esText.BackgroundTransparency = 1
esText.Text = "ES"
esText.TextColor3 = Color3.fromRGB(255,255,255)
esText.TextStrokeTransparency = 0.25
esText.Font = Enum.Font.GothamBlack
esText.TextScaled = true
esText.ZIndex = 2
esText.TextYAlignment = Enum.TextYAlignment.Center
esText.TextXAlignment = Enum.TextXAlignment.Center
esText.TextSize = 12

esText:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
    esText.TextSize = math.min(esText.AbsoluteSize.Y * 0.32, 13) -- Smaller: 32% height, max 13px
end)

-- Animate function (scale & transparency)
local function animateObj(obj, scaleFrom, scaleTo, transpFrom, transpTo, duration, cb)
    local scaleObj = obj:FindFirstChildOfClass("UIScale") or Instance.new("UIScale", obj)
    scaleObj.Scale = scaleFrom
    obj.BackgroundTransparency = transpFrom
    obj.Visible = true
    local tw1 = TweenService:Create(scaleObj, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {Scale = scaleTo})
    local tw2 = TweenService:Create(obj, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {BackgroundTransparency = transpTo})
    tw1:Play() tw2:Play()
    tw1.Completed:Connect(function()
        if cb then cb() end
    end)
end

-- Draggable circle
local draggingMini, dragInput, dragStart, startPos
minimizedButton.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        draggingMini = true
        dragStart = input.Position
        startPos = minimizedButton.Position
        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                draggingMini = false
            end
        end)
    end
end)
UserInputService.InputChanged:Connect(function(input)
    if draggingMini and input.UserInputType == Enum.UserInputType.MouseMovement then
        local delta = input.Position - dragStart
        minimizedButton.Position = UDim2.new(
            startPos.X.Scale, startPos.X.Offset + delta.X,
            startPos.Y.Scale, startPos.Y.Offset + delta.Y
        )
    end
end)

-- Restore GUI with animation
local function restoreGUI()
    animateObj(minimizedButton, 1, 0.2, 0.08, 1, 0.21, function()
        minimizedButton.Visible = false
        mainFrame.Visible = true
        UIScale.Scale = 0.8
        mainFrame.BackgroundTransparency = 1
        animateObj(mainFrame, 0.8, 1, 1, 0.1, 0.21)
        uiEnabled = true
        minimized = false
    end)
end

minimizedButton.MouseButton1Click:Connect(restoreGUI)

-- Minimize logic w/ animation
local function minimizeGUI()
    animateObj(mainFrame, 1, 0.8, 0.1, 1, 0.21, function()
        mainFrame.Visible = false
        -- Put at top-left of main GUI (relative to screen)
        local guiAbsPos = mainFrame.AbsolutePosition
        minimizedButton.Position = UDim2.new(0, guiAbsPos.X, 0, guiAbsPos.Y)
        animateObj(minimizedButton, 0.2, 1, 1, 0.08, 0.21)
        minimizedButton.Visible = true
        minimized = true
    end)
end

minimize.MouseButton1Click:Connect(minimizeGUI)

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if not gameProcessed and input.KeyCode == Enum.KeyCode.Insert then
        if minimized then
            restoreGUI()
        else
            minimizeGUI()
        end
    end
end)

local resizeCorner = Instance.new('Frame', mainFrame)
resizeCorner.Size = UDim2.new(0, 18, 0, 18)
resizeCorner.Position = UDim2.new(1, -18, 1, -18)
resizeCorner.BackgroundColor3 = Color3.fromRGB(31, 81, 138)
resizeCorner.BorderSizePixel = 0
resizeCorner.BackgroundTransparency = 0.3
resizeCorner.Active = true
resizeCorner.ZIndex = 5
Instance.new('UICorner', resizeCorner).CornerRadius = UDim.new(0, 8)

local resizing = false
local resizeStartSize, inputStartPos

resizeCorner.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        resizing = true
        mainFrame.Draggable = false
        resizeStartSize = mainFrame.Size
        inputStartPos = input.Position
        resizeCorner.BackgroundTransparency = 0
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if resizing and input.UserInputType == Enum.UserInputType.MouseMovement then
        local delta = input.Position - inputStartPos
        local newWidth = math.clamp(resizeStartSize.X.Offset + delta.X, 400, 1000)
        local newHeight = math.clamp(resizeStartSize.Y.Offset + delta.Y, 200, 700)
        mainFrame.Size = UDim2.new(0, newWidth, 0, newHeight)
        sidebar.Size = UDim2.new(0, 140, 0, mainFrame.Size.Y.Offset - 80)
        contentFrame.Size = UDim2.new(0, mainFrame.Size.X.Offset - 170, 0, mainFrame.Size.Y.Offset - 80)
        contentFrame.Position = UDim2.new(0, 160, 0, 50)
        resizeCorner.Position = UDim2.new(1, -18, 1, -18)
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        resizing = false
        mainFrame.Draggable = true
        resizeCorner.BackgroundTransparency = 0.3
    end
end)

mainFrame:GetPropertyChangedSignal("Size"):Connect(function()
    sidebar.Size = UDim2.new(0, 140, 0, mainFrame.Size.Y.Offset - 80)
    contentFrame.Size = UDim2.new(0, mainFrame.Size.X.Offset - 170, 0, mainFrame.Size.Y.Offset - 80)
    contentFrame.Position = UDim2.new(0, 160, 0, 50)
    resizeCorner.Position = UDim2.new(1, -18, 1, -18)
end)
