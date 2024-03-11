import logo from './logo.svg';
import './ControlPanel.css';

import React, { useState } from 'react';
import { Tree, Button, Card, Row, Col } from 'antd';

const { TreeNode } = Tree;

const data = [
    {
        title: 'Item 1',
        type: '3D Print',
        size: 'Small',
        gCodeFile: 'item1.gcode',
        svgFile: 'item1.svg',
        status: 'Not Started',
        children: [
            {
                title: 'Subitem 1',
                type: 'Laser Cut',
                size: 'Medium',
                gCodeFile: 'subitem1.gcode',
                svgFile: 'subitem1.svg',
                status: 'Not Started',
            },
            {
                title: 'Subitem 2',
                type: '3D Print',
                size: 'Large',
                gCodeFile: 'subitem2.gcode',
                svgFile: 'subitem2.svg',
                status: 'Not Started',
            },
        ],
    },
    {
        title: 'Item 2',
        type: 'Laser Cut',
        size: 'Medium',
        gCodeFile: 'item2.gcode',
        svgFile: 'item2.svg',
        status: 'Not Started',
    },
];

const ControlPanel = () => {
    const [treeData, setTreeData] = useState(data);

    const handleStart = (item) => {
        const updatedTreeData = [...treeData];
        const findAndUpdateItem = (items) => {
            for (let i = 0; i < items.length; i++) {
                if (items[i].title === item.title) {
                    items[i].status = 'In Progress';
                    break;
                } else if (items[i].children) {
                    findAndUpdateItem(items[i].children);
                }
            }
        };
        findAndUpdateItem(updatedTreeData);
        setTreeData(updatedTreeData);
    };

    const renderTreeNodes = (data) =>
        data.map((item) => (
            <TreeNode title={item.title} key={item.title} dataRef={item}>
                {item.children && renderTreeNodes(item.children)}
            </TreeNode>
        ));

    return (
        <div>
            <h1>Fabrication Control Panel</h1>
            <Tree showLine defaultExpandAll>
                {renderTreeNodes(treeData)}
            </Tree>
            <h2>Job Details</h2>
            <Card>
                <Row>
                    <Col span={8}>
                        <h3>Type:</h3>
                        <p>{treeData[0].type}</p>
                    </Col>
                    <Col span={8}>
                        <h3>Size:</h3>
                        <p>{treeData[0].size}</p>
                    </Col>
                    <Col span={8}>
                        <h3>Status:</h3>
                        <p>{treeData[0].status}</p>
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <Button type="primary" icon="download" href={treeData[0].gCodeFile}>
                            Download G-Code
                        </Button>
                    </Col>
                    <Col span={12}>
                        <Button type="primary" onClick={() => handleStart(treeData[0])}>
                            Start Fabrication
                        </Button>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default ControlPanel;